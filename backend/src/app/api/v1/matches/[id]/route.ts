import { NextRequest } from 'next/server';
import { z } from 'zod';
import { JoinMode, MatchStatus, PlayerSkillLevel } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import { verifySession, isQuickMatchHostAllowed } from '@/lib/auth';
import { toMatchDto } from '@/lib/mappers';
import { CACHE_KEYS, cacheGet, cacheSet, invalidateMatchesCache } from '@/lib/cache';

const updateMatchSchema = z.object({
  title: z.string().trim().min(3).max(150).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  sportId: z.string().trim().optional(),
  location: z
    .object({
      name: z.string().trim().max(150).optional().nullable(),
      address: z.string().trim().max(255).optional().nullable(),
      city: z.string().trim().max(100).optional(),
      area: z.string().trim().max(100).optional().nullable(),
      latitude: z.number().min(-90).max(90).optional(),
      longitude: z.number().min(-180).max(180).optional(),
    })
    .optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  capacity: z.number().int().min(2).max(200).optional(),
  mode: z.enum(['INSTANT_JOIN', 'APPLICATION_REQUIRED', 'APPROVAL_REQUIRED', 'WAITLIST']).optional(),
  skillLevel: z
    .enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT', 'PROFESSIONAL'])
    .optional(),
  feeAmount: z.number().min(0).max(100000).optional(),
  equipmentFee: z.number().min(0).max(100000).optional(),
  allowOnlinePayment: z.boolean().optional(),
  coverImageUrl: z.string().trim().url().max(1000).optional().nullable(),
  rules: z.string().trim().max(2000).optional().nullable(),
  guardianRequired: z.boolean().optional(),
  status: z.enum(['OPEN', 'FULL', 'CLOSED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  equipment: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().trim().min(1).max(120),
        quantity: z.number().int().min(1).max(100).optional().default(1),
      })
    )
    .optional(),
});

function withViewerEquipmentFlags(
  dto: ReturnType<typeof toMatchDto>,
  viewerUserId?: string | null
) {
  if (!viewerUserId || !Array.isArray(dto.equipment)) return dto;
  return {
    ...dto,
    equipment: dto.equipment.map((eq) => {
      const myContrib = eq.contributors?.find((c) => c.userId === viewerUserId);
      return {
        ...eq,
        userPledged: Boolean(myContrib),
        userCommittedQty: myContrib?.quantity || 0,
      };
    }),
  };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession(request);
    const { id } = await context.params;
    const cacheKey = CACHE_KEYS.MATCH_BY_ID(id);
    const cached = await cacheGet<ReturnType<typeof toMatchDto>>(cacheKey);
    if (cached) {
      return ok(withViewerEquipmentFlags(cached, session?.userId));
    }

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        sport: true,
        organizer: { select: { id: true, fullName: true, profileImageUrl: true } },
        venue: true,
        participants: {
          where: { leftAt: null },
          select: {
            id: true,
            userId: true,
            status: true,
            joinedAt: true,
            user: { select: { fullName: true, profileImageUrl: true } },
          },
        },
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

    if (!match) {
      return fail('RESOURCE_NOT_FOUND', 'Match not found', 404);
    }

    const dto = toMatchDto(match);
    const ratingAgg = await prisma.userRating.aggregate({
      where: { targetUserId: match.organizerId, contextRole: 'PLAYER_TO_ORGANIZER' },
      _avg: { score: true },
      _count: { score: true },
    });
    const enrichedDto = {
      ...dto,
      organizer: {
        ...dto.organizer,
        rating: ratingAgg._avg.score ? Number(ratingAgg._avg.score.toFixed(2)) : null,
        ratingCount: ratingAgg._count.score,
      },
    };
    await cacheSet(cacheKey, enrichedDto, 120);
    return ok(withViewerEquipmentFlags(enrichedDto, session?.userId));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { id } = await context.params;
    const existing = await prisma.match.findUnique({
      where: { id },
      include: { participants: { where: { status: 'CONFIRMED' }, select: { id: true } } },
    });

    if (!existing) {
      return fail('RESOURCE_NOT_FOUND', 'Match not found', 404);
    }

    const isAdmin = session.roles.includes('ADMIN');
    if (existing.organizerId !== session.userId && !isAdmin) {
      return fail('ACCESS_DENIED', 'Only the match organizer can update this match', 403);
    }
    const hostCheck = await isQuickMatchHostAllowed(existing.organizerId, session.roles);

    const body = await request.json();
    const parsed = updateMatchSchema.parse(body);

    const startTime = parsed.startTime ? new Date(parsed.startTime) : existing.startTime;
    const endTime = parsed.endTime ? new Date(parsed.endTime) : existing.endTime;
    if (endTime <= startTime) {
      return fail('BAD_REQUEST', 'Match end time must be after start time', 400);
    }

    if (parsed.capacity !== undefined && parsed.capacity < existing.participants.length) {
      return fail(
        'BAD_REQUEST',
        `Capacity cannot be less than currently confirmed players (${existing.participants.length})`,
        400
      );
    }

    let joinMode: JoinMode | undefined;
    if (parsed.mode) {
      joinMode =
        parsed.mode === 'APPLICATION_REQUIRED' || parsed.mode === 'APPROVAL_REQUIRED'
          ? JoinMode.APPLICATION_REQUIRED
          : parsed.mode === 'WAITLIST'
            ? JoinMode.WAITLIST
            : JoinMode.INSTANT_JOIN;
    }

    if (parsed.equipment) {
      const existingReqs = await prisma.equipmentRequirement.findMany({ where: { matchId: id } });
      const keepIds = new Set<string>();
      for (const item of parsed.equipment) {
        const matchById = item.id ? existingReqs.find((r) => r.id === item.id) : undefined;
        if (matchById) {
          keepIds.add(matchById.id);
          await prisma.equipmentRequirement.update({
            where: { id: matchById.id },
            data: { equipmentName: item.name, requiredQuantity: Math.max(1, item.quantity || 1) },
          });
        } else {
          const createdReq = await prisma.equipmentRequirement.create({
            data: {
              matchId: id,
              equipmentName: item.name,
              requiredQuantity: Math.max(1, item.quantity || 1),
              committedQuantity: 0,
            },
          });
          keepIds.add(createdReq.id);
        }
      }
      const toDelete = existingReqs.filter((r) => !keepIds.has(r.id)).map((r) => r.id);
      if (toDelete.length > 0) {
        await prisma.equipmentRequirement.deleteMany({ where: { id: { in: toDelete } } });
      }
    }

    const updated = await prisma.match.update({
      where: { id },
      data: {
        ...(parsed.title !== undefined ? { title: parsed.title } : {}),
        ...(parsed.description !== undefined ? { description: parsed.description ?? '' } : {}),
        ...(parsed.sportId !== undefined ? { sportId: parsed.sportId } : {}),
        ...(parsed.location?.name !== undefined ? { locationName: parsed.location.name } : {}),
        ...(parsed.location?.address !== undefined ? { locationAddress: parsed.location.address } : {}),
        ...(parsed.location?.city !== undefined ? { city: parsed.location.city } : {}),
        ...(parsed.location?.area !== undefined ? { area: parsed.location.area } : {}),
        ...(parsed.location?.latitude !== undefined ? { latitude: parsed.location.latitude } : {}),
        ...(parsed.location?.longitude !== undefined ? { longitude: parsed.location.longitude } : {}),
        ...(parsed.startTime !== undefined ? { startTime } : {}),
        ...(parsed.endTime !== undefined ? { endTime } : {}),
        ...(parsed.capacity !== undefined ? { capacity: parsed.capacity } : {}),
        ...(joinMode ? { joinMode } : {}),
        ...(parsed.skillLevel !== undefined
          ? { skillLevel: parsed.skillLevel as PlayerSkillLevel }
          : {}),
        ...(parsed.feeAmount !== undefined ? { feeAmount: parsed.feeAmount } : {}),
        ...(parsed.equipmentFee !== undefined ? { equipmentFee: parsed.equipmentFee } : {}),
        ...(parsed.allowOnlinePayment !== undefined
          ? {
              allowOnlinePayment: hostCheck.isFullOrganizer
                ? parsed.allowOnlinePayment
                : false,
            }
          : {}),
        ...(parsed.coverImageUrl !== undefined ? { coverImageUrl: parsed.coverImageUrl } : {}),
        ...(parsed.rules !== undefined ? { rules: parsed.rules } : {}),
        ...(parsed.guardianRequired !== undefined
          ? { guardianRequired: parsed.guardianRequired }
          : {}),
        ...(parsed.status !== undefined ? { status: parsed.status as MatchStatus } : {}),
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

    const dto = withViewerEquipmentFlags(toMatchDto(updated), session.userId);
    await invalidateMatchesCache(id);
    return ok(dto);
  } catch (error) {
    return handleRouteError(error);
  }
}
