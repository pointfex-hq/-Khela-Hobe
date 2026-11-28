import { NextRequest } from 'next/server';
import { z } from 'zod';
import { NotificationType, TournamentStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok, parsePagination, toPageResponse } from '@/lib/http';
import { verifySession, isOrganizerVerifiedForCreation } from '@/lib/auth';
import { toTournamentDto } from '@/lib/mappers';
import { CACHE_KEYS, cacheGet, cacheSet, invalidateTournamentsCache } from '@/lib/cache';
import { broadcastAreaMatchAlert } from '@/lib/areaNotifications';
import { recordAuditLog } from '@/lib/audit';

const createTournamentSchema = z.object({
  title: z.string().trim().min(3).max(160),
  sport: z.string().trim().min(2).max(100),
  format: z.string().trim().max(100).optional().default('Knockouts'),
  description: z.string().trim().min(5).max(3000),
  features: z.string().trim().max(3000).optional().nullable(),
  rules: z.string().trim().max(3000).optional().nullable(),
  championPrize: z.string().trim().max(250).optional().nullable(),
  runnerUpPrize: z.string().trim().max(250).optional().nullable(),
  mvpPrize: z.string().trim().max(250).optional().nullable(),
  prizePool: z.string().trim().max(250).optional().nullable(),
  venueName: z.string().trim().min(2).max(200).optional(),
  venue: z.string().trim().min(2).max(200).optional(),
  city: z.string().trim().max(100).optional().default('Dhaka'),
  area: z.string().trim().max(100).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  startDate: z.string().trim().min(4).max(40).optional(),
  date: z.string().trim().min(4).max(40).optional(),
  time: z.string().trim().max(20).optional().default('17:00'),
  duration: z.string().trim().max(60).optional().default('2 Days'),
  maxTeams: z.number().int().min(2).max(256).optional(),
  totalTeams: z.number().int().min(2).max(256).optional(),
  teamSize: z.number().int().min(1).max(30).optional().default(7),
  entryFee: z.number().min(0).max(200000).optional().default(0),
  paymentMode: z.enum(['OPEN_FREE', 'ONLINE_REQUIRED', 'OPTIONAL_VENUE']).optional().default('OPTIONAL_VENUE'),
  requireTeamApproval: z.boolean().optional().default(true),
  spectatorMode: z.enum(['NONE', 'OPEN_FREE', 'LIMITED_TICKETS']).optional().default('OPEN_FREE'),
  spectatorCapacity: z.number().int().min(0).max(50000).optional().default(0),
  ticketPrice: z.number().min(0).max(50000).optional().default(0),
  vipTicketPrice: z.number().min(0).max(100000).optional().nullable(),
  coverImageUrl: z.string().trim().max(1000).optional().nullable(),
  image: z.string().trim().max(1000).optional().nullable(),
  bannerImages: z.array(z.string().trim().max(1000)).max(4).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession(request);
    const { page, size, skip, searchParams } = parsePagination(request.url, 9);
    const paginate = searchParams.has('page') || searchParams.has('size');
    const city = searchParams.get('city')?.trim();
    const sport = searchParams.get('sport')?.trim();
    const q = searchParams.get('q')?.trim();

    if (!city && !sport && !q && !session) {
      const cacheKey = paginate
        ? `${CACHE_KEYS.TOURNAMENTS_PUBLIC}:p:${page}:${size}`
        : CACHE_KEYS.TOURNAMENTS_PUBLIC;
      const cached = await cacheGet<unknown>(cacheKey);
      if (cached) {
        return ok(cached);
      }
    }

    const where: Record<string, unknown> = {
      status: { in: [TournamentStatus.APPROVED, TournamentStatus.COMPLETED] },
    };

    if (city && city !== 'All Bangladesh') {
      where.OR = [
        { city: { contains: city, mode: 'insensitive' } },
        { area: { contains: city, mode: 'insensitive' } },
      ];
    }
    if (sport && sport !== 'All Sports') {
      where.sport = { contains: sport, mode: 'insensitive' };
    }
    if (q) {
      const qOr = [
        { title: { contains: q, mode: 'insensitive' } },
        { venueName: { contains: q, mode: 'insensitive' } },
        { area: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { sport: { contains: q, mode: 'insensitive' } },
      ];
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: qOr }];
        delete where.OR;
      } else {
        where.OR = qOr;
      }
    }

    const [tournaments, total] = await Promise.all([
      prisma.tournament.findMany({
        where,
        ...(paginate ? { skip, take: size } : {}),
        orderBy: { createdAt: 'desc' },
        include: {
          organizer: { select: { id: true, fullName: true, profileImageUrl: true } },
          registrations: { select: { id: true, status: true } },
          interests: { select: { userId: true } },
          tickets: { where: { status: { not: 'CANCELLED' } }, select: { id: true, status: true } },
        },
      }),
      paginate ? prisma.tournament.count({ where }) : Promise.resolve(0),
    ]);

    const dtos = tournaments.map((t) => toTournamentDto(t, session?.userId));
    const resultPayload = paginate ? toPageResponse(dtos, page, size, total) : dtos;

    if (!city && !sport && !q && !session) {
      const cacheKey = paginate
        ? `${CACHE_KEYS.TOURNAMENTS_PUBLIC}:p:${page}:${size}`
        : CACHE_KEYS.TOURNAMENTS_PUBLIC;
      await cacheSet(cacheKey, resultPayload, 120);
    }

    return ok(resultPayload);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }
    if (!session.roles.includes('ORGANIZER') && !session.roles.includes('ADMIN')) {
      return fail('ACCESS_DENIED', 'Only organizers or admins can create tournaments', 403);
    }

    const approvalCheck = await isOrganizerVerifiedForCreation(session.userId, session.roles);
    if (!approvalCheck.allowed) {
      return fail('ACCESS_DENIED', approvalCheck.message || 'Organizer verification required', 403);
    }

    const body = await request.json();
    const parsed = createTournamentSchema.parse(body);

    const venueName = parsed.venueName || parsed.venue;
    const startDate = parsed.startDate || parsed.date;
    const maxTeams = parsed.maxTeams ?? parsed.totalTeams ?? 16;

    if (!venueName) {
      return fail('VALIDATION_ERROR', 'Venue name is required', 400);
    }
    if (!startDate) {
      return fail('VALIDATION_ERROR', 'Start date is required', 400);
    }

    const isAdmin = session.roles.includes('ADMIN');
    const finalEntryFee = parsed.paymentMode === 'OPEN_FREE' ? 0 : parsed.entryFee ?? 0;
    const finalTicketPrice =
      parsed.spectatorMode === 'LIMITED_TICKETS' ? parsed.ticketPrice ?? 0 : 0;

    const created = await prisma.tournament.create({
      data: {
        title: parsed.title,
        sport: parsed.sport,
        format: parsed.format || 'Knockouts',
        description: parsed.description,
        features: parsed.features ?? null,
        rules: parsed.rules ?? null,
        championPrize: parsed.championPrize ?? null,
        runnerUpPrize: parsed.runnerUpPrize ?? null,
        mvpPrize: parsed.mvpPrize ?? null,
        prizePool: parsed.prizePool ?? null,
        organizerId: session.userId,
        venueName,
        city: parsed.city || 'Dhaka',
        area: parsed.area ?? null,
        latitude: parsed.latitude ?? null,
        longitude: parsed.longitude ?? null,
        startDate,
        time: parsed.time || '17:00',
        duration: parsed.duration || '2 Days',
        maxTeams,
        teamSize: parsed.teamSize ?? 7,
        entryFee: finalEntryFee,
        paymentMode: parsed.paymentMode,
        requireTeamApproval: parsed.requireTeamApproval,
        spectatorMode: parsed.spectatorMode,
        spectatorCapacity:
          parsed.spectatorMode === 'LIMITED_TICKETS' ? parsed.spectatorCapacity ?? 100 : 0,
        ticketPrice: finalTicketPrice,
        vipTicketPrice:
          parsed.spectatorMode === 'LIMITED_TICKETS' ? parsed.vipTicketPrice ?? null : null,
        coverImageUrl:
          (parsed.bannerImages && parsed.bannerImages[0]) ||
          parsed.coverImageUrl ||
          parsed.image ||
          null,
        bannerImages:
          parsed.bannerImages && parsed.bannerImages.length > 0
            ? parsed.bannerImages.slice(0, 4)
            : parsed.coverImageUrl || parsed.image
              ? [String(parsed.coverImageUrl || parsed.image)]
              : [],
        status: isAdmin ? TournamentStatus.APPROVED : TournamentStatus.PENDING_APPROVAL,
      },
      include: {
        organizer: { select: { id: true, fullName: true, profileImageUrl: true } },
        registrations: { select: { id: true, status: true } },
        interests: { select: { userId: true } },
        tickets: { select: { id: true, status: true } },
      },
    });

    if (!isAdmin) {
      const admins = await prisma.userRoleAssignment.findMany({
        where: { role: 'ADMIN' },
        select: { userId: true },
      });
      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map((a) => ({
            userId: a.userId,
            type: NotificationType.GENERAL,
            title: 'Tournament Pending Approval',
            message: `"${created.title}" (${created.sport}, ${created.city}) was submitted for moderation.`,
            link: '/admin/moderation',
          })),
        });
      }
    }

    await invalidateTournamentsCache();
    await recordAuditLog({
      userId: session.userId,
      action: 'TOURNAMENT_CREATED',
      entityType: 'TOURNAMENT',
      entityId: created.id,
      notes: `Created tournament "${created.title}" (${created.status})`,
      request,
    });

    if (isAdmin) {
      broadcastAreaMatchAlert({
        kind: 'Tournament',
        title: created.title,
        sport: created.sport,
        city: created.city,
        area: created.area,
        venue: created.venueName,
        schedule: `${created.startDate} • ${created.time}`,
        link: `/events/${created.id}`,
        excludeUserId: session.userId,
      }).catch(() => {});
    }

    return ok(toTournamentDto(created), 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
