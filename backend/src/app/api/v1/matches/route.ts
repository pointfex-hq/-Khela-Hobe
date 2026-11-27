import { NextRequest } from 'next/server';
import { z } from 'zod';
import { JoinMode, MatchStatus, MatchType, PlayerSkillLevel, Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok, parsePagination, toPageResponse } from '@/lib/http';
import { verifySession, isQuickMatchHostAllowed } from '@/lib/auth';
import { toMatchDto } from '@/lib/mappers';
import { CACHE_KEYS, cacheGet, cacheSet, invalidateMatchesCache } from '@/lib/cache';
import { broadcastAreaMatchAlert } from '@/lib/areaNotifications';
import { recordAuditLog } from '@/lib/audit';

const matchLocationSchema = z.object({
  name: z.string().trim().max(150).optional().nullable(),
  address: z.string().trim().max(255).optional().nullable(),
  city: z.string().trim().min(1).max(100).optional(),
  area: z.string().trim().max(100).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  source: z.string().optional(),
});

const createMatchSchema = z.object({
  title: z.string().trim().min(3, 'Match title must be at least 3 characters').max(150),
  description: z.string().trim().max(2000).optional().nullable(),
  sportId: z.string().trim().min(1, 'Sport is required'),
  venueId: z.string().trim().optional().nullable(),
  location: matchLocationSchema.optional(),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  capacity: z.number().int().min(2).max(200),
  minimumPlayers: z.number().int().min(1).max(200).optional(),
  mode: z.enum(['INSTANT_JOIN', 'APPLICATION_REQUIRED', 'APPROVAL_REQUIRED', 'WAITLIST']).optional(),
  joinMode: z
    .enum(['INSTANT_JOIN', 'APPLICATION_REQUIRED', 'APPROVAL_REQUIRED', 'WAITLIST'])
    .optional(),
  skillLevel: z
    .enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT', 'PROFESSIONAL'])
    .optional()
    .nullable(),
  feeAmount: z.number().min(0).max(100000).optional(),
  equipmentFee: z.number().min(0).max(100000).optional(),
  allowOnlinePayment: z.boolean().optional(),
  coverImageUrl: z.string().trim().url().max(1000).optional().nullable(),
  rules: z.string().trim().max(2000).optional().nullable(),
  guardianRequired: z.boolean().optional(),
  matchType: z.enum(['QUICK_MATCH', 'ORGANIZED_MATCH']).optional(),
  equipment: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(120),
        quantity: z.number().int().min(1).max(100).optional().default(1),
      })
    )
    .optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { page, size, skip, searchParams } = parsePagination(request.url, 20);
    const sportId = searchParams.get('sportId')?.trim();
    const city = searchParams.get('city')?.trim();
    const status = searchParams.get('status')?.trim()?.toUpperCase();
    const skillLevel = searchParams.get('skillLevel')?.trim()?.toUpperCase();
    const from = searchParams.get('from')?.trim();
    const to = searchParams.get('to')?.trim();
    const q = searchParams.get('q')?.trim();

    const cacheKey = `${CACHE_KEYS.MATCHES_PREFIX}${page}:${size}:${sportId || ''}:${city || ''}:${status || ''}:${skillLevel || ''}:${from || ''}:${to || ''}:${q || ''}`;
    const cached = await cacheGet<ReturnType<typeof toPageResponse>>(cacheKey);
    if (cached) {
      return ok(cached);
    }

    const where: Prisma.MatchWhereInput = {};
    if (sportId) where.sportId = sportId;
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (status && Object.values(MatchStatus).includes(status as MatchStatus)) {
      where.status = status as MatchStatus;
    }
    if (skillLevel && Object.values(PlayerSkillLevel).includes(skillLevel as PlayerSkillLevel)) {
      where.skillLevel = skillLevel as PlayerSkillLevel;
    }
    if (from || to) {
      where.startTime = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      };
    }
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { locationName: { contains: q, mode: 'insensitive' } },
        { area: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where,
        skip,
        take: size,
        orderBy: { startTime: 'asc' },
        include: {
          sport: true,
          organizer: { select: { id: true, fullName: true, profileImageUrl: true } },
          venue: true,
          participants: { select: { status: true } },
          equipmentRequirements: {
            orderBy: { createdAt: 'asc' },
            include: {
              contributions: {
                include: { user: { select: { id: true, fullName: true, profileImageUrl: true } } },
              },
            },
          },
        },
      }),
      prisma.match.count({ where }),
    ]);

    const payload = toPageResponse(matches.map(toMatchDto), page, size, total);
    await cacheSet(cacheKey, payload, 120);
    return ok(payload);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required to create a match', 401);
    }

    const hostCheck = await isQuickMatchHostAllowed(session.userId, session.roles);
    if (!hostCheck.allowed) {
      return fail('ACCESS_DENIED', hostCheck.message || 'Match hosting requires verification', 403);
    }

    const body = await request.json();
    const parsed = createMatchSchema.parse(body);

    const startTime = new Date(parsed.startTime);
    const endTime = new Date(parsed.endTime);
    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      return fail('BAD_REQUEST', 'Invalid startTime or endTime timestamp', 400);
    }
    if (endTime <= startTime) {
      return fail('BAD_REQUEST', 'Match end time must be after start time', 400, [
        { field: 'endTime', message: 'End time must be after start time' },
      ]);
    }

    const sport = await prisma.sport.findFirst({
      where: {
        OR: [
          { id: parsed.sportId },
          { slug: parsed.sportId.toLowerCase() },
          { name: { equals: parsed.sportId, mode: 'insensitive' } },
        ],
      },
    });
    if (!sport) {
      return fail('RESOURCE_NOT_FOUND', 'Selected sport was not found', 404, [
        { field: 'sportId', message: 'Sport not found' },
      ]);
    }

    let venue = null;
    if (parsed.venueId) {
      venue = await prisma.venue.findUnique({ where: { id: parsed.venueId } });
      if (!venue) {
        return fail('RESOURCE_NOT_FOUND', 'Selected venue was not found', 404);
      }
    }

    const rawMode = parsed.mode ?? parsed.joinMode ?? 'INSTANT_JOIN';
    const joinMode: JoinMode =
      rawMode === 'APPLICATION_REQUIRED' || rawMode === 'APPROVAL_REQUIRED'
        ? JoinMode.APPLICATION_REQUIRED
        : rawMode === 'WAITLIST'
          ? JoinMode.WAITLIST
          : JoinMode.INSTANT_JOIN;

    const matchType: MatchType =
      parsed.matchType === 'ORGANIZED_MATCH' ? MatchType.ORGANIZED_MATCH : MatchType.QUICK_MATCH;

    const latitude = parsed.location?.latitude ?? venue?.latitude ?? 23.8103;
    const longitude = parsed.location?.longitude ?? venue?.longitude ?? 90.4125;
    const city = parsed.location?.city || venue?.city || 'Dhaka';
    const area = parsed.location?.area ?? venue?.area ?? null;
    const locationName = parsed.location?.name ?? venue?.name ?? area ?? city;
    const locationAddress = parsed.location?.address ?? venue?.address ?? null;

    const match = await prisma.match.create({
      data: {
        title: parsed.title,
        description: parsed.description || '',
        matchType,
        sportId: sport.id,
        organizerId: session.userId,
        venueId: venue?.id ?? null,
        latitude,
        longitude,
        locationName,
        locationAddress,
        city,
        area,
        startTime,
        endTime,
        capacity: parsed.capacity,
        minimumPlayers: Math.min(parsed.capacity, parsed.minimumPlayers ?? 2),
        skillLevel: (parsed.skillLevel as PlayerSkillLevel | undefined) ?? PlayerSkillLevel.INTERMEDIATE,
        joinMode,
        status: MatchStatus.OPEN,
        feeAmount: parsed.feeAmount ?? 0,
        equipmentFee: parsed.equipmentFee ?? 0,
        allowOnlinePayment: hostCheck.isFullOrganizer ? (parsed.allowOnlinePayment ?? true) : false,
        coverImageUrl: parsed.coverImageUrl ?? null,
        rules: parsed.rules ?? null,
        guardianRequired: parsed.guardianRequired ?? false,
        ...(parsed.equipment && parsed.equipment.length > 0
          ? {
              equipmentRequirements: {
                create: parsed.equipment.map((eq) => ({
                  equipmentName: eq.name,
                  requiredQuantity: Math.max(1, eq.quantity || 1),
                  committedQuantity: 0,
                })),
              },
            }
          : {}),
      },
      include: {
        sport: true,
        organizer: { select: { id: true, fullName: true, profileImageUrl: true } },
        venue: true,
        participants: { select: { status: true } },
        equipmentRequirements: {
          orderBy: { createdAt: 'asc' },
          include: {
            contributions: {
              include: { user: { select: { id: true, fullName: true, profileImageUrl: true } } },
            },
          },
        },
      },
    });

    await prisma.matchStatusHistory.create({
      data: {
        matchId: match.id,
        previousStatus: MatchStatus.PROPOSED,
        newStatus: MatchStatus.OPEN,
        changedBy: session.userId,
        notes: 'Match created',
      },
    });

    const dto = toMatchDto(match);
    await invalidateMatchesCache(match.id);

    broadcastAreaMatchAlert({
      kind: 'Match',
      title: match.title,
      sport: sport.name,
      city,
      area,
      venue: locationName,
      schedule: startTime.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
      link: `/matches/${match.id}`,
      excludeUserId: session.userId,
    }).catch(() => {});

    await recordAuditLog({
      userId: session.userId,
      action: 'MATCH_CREATED',
      entityType: 'MATCH',
      entityId: match.id,
      notes: `Published match "${match.title}" in ${area || city}`,
      request,
    });

    return ok(dto, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
