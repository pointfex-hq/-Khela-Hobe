import { NextRequest } from 'next/server';
import { z } from 'zod';
import { NotificationType, ParticipantStatus, RatingContext } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok, toEpoch } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { invalidateMatchesCache, invalidateUserCache } from '@/lib/cache';
import { recordAuditLog } from '@/lib/audit';

const ratingSchema = z.object({
  targetUserId: z.string().trim().min(1),
  matchId: z.string().trim().optional().nullable(),
  contextRole: z.enum(['PLAYER_TO_ORGANIZER', 'ORGANIZER_TO_PLAYER']),
  score: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession(request);
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('targetUserId')?.trim();
    const matchId = searchParams.get('matchId')?.trim() || undefined;
    const contextParam = searchParams.get('contextRole')?.trim().toUpperCase();

    if (!targetUserId) {
      return fail('VALIDATION_ERROR', 'targetUserId is required', 400);
    }

    const where: Record<string, unknown> = { targetUserId };
    if (contextParam === 'PLAYER_TO_ORGANIZER' || contextParam === 'ORGANIZER_TO_PLAYER') {
      where.contextRole = contextParam as RatingContext;
    }

    const rows = await prisma.userRating.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: {
        rater: { select: { id: true, fullName: true, profileImageUrl: true } },
        match: { select: { id: true, title: true } },
      },
    });

    const count = rows.length;
    const average =
      count > 0 ? Number((rows.reduce((s, r) => s + r.score, 0) / count).toFixed(2)) : null;

    const myRatingRow = session
      ? rows.find(
          (r) =>
            r.raterId === session.userId &&
            (matchId ? r.matchId === matchId : true)
        )
      : null;

    return ok({
      average,
      count,
      myRating: myRatingRow
        ? {
            id: myRatingRow.id,
            score: myRatingRow.score,
            comment: myRatingRow.comment,
            matchId: myRatingRow.matchId,
          }
        : null,
      reviews: rows.map((r) => ({
        id: r.id,
        score: r.score,
        comment: r.comment,
        contextRole: r.contextRole,
        raterId: r.raterId,
        raterName: r.rater?.fullName || 'Athlete',
        raterAvatar: r.rater?.profileImageUrl ?? null,
        matchId: r.matchId,
        matchTitle: r.match?.title || null,
        createdAt: toEpoch(r.createdAt),
      })),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required to submit a rating', 401);
    }

    const body = await request.json();
    const parsed = ratingSchema.parse(body);

    if (parsed.targetUserId === session.userId) {
      return fail('BAD_REQUEST', 'You cannot rate your own profile.', 400);
    }

    const contextRole = parsed.contextRole as RatingContext;
    const matchId = parsed.matchId || null;

    if (matchId) {
      const match = await prisma.match.findUnique({
        where: { id: matchId },
        select: { id: true, organizerId: true, title: true },
      });
      if (!match) {
        return fail('RESOURCE_NOT_FOUND', 'Match not found', 404);
      }

      if (contextRole === RatingContext.PLAYER_TO_ORGANIZER) {
        if (match.organizerId !== parsed.targetUserId) {
          return fail('BAD_REQUEST', 'Target user is not the organizer of this match.', 400);
        }
        const participated = await prisma.matchParticipant.findFirst({
          where: {
            matchId,
            userId: session.userId,
            status: { in: [ParticipantStatus.CONFIRMED, ParticipantStatus.NO_SHOW] },
          },
        });
        if (!participated && !session.roles.includes('ADMIN')) {
          return fail(
            'ACCESS_DENIED',
            'Only players who joined this match can rate its organizer.',
            403
          );
        }
      } else {
        if (match.organizerId !== session.userId && !session.roles.includes('ADMIN')) {
          return fail(
            'ACCESS_DENIED',
            'Only the match host/organizer can rate players in this match.',
            403
          );
        }
        const participated = await prisma.matchParticipant.findFirst({
          where: {
            matchId,
            userId: parsed.targetUserId,
          },
        });
        if (!participated) {
          return fail('BAD_REQUEST', 'Target player did not participate in this match.', 400);
        }
      }
    }

    const existing = await prisma.userRating.findFirst({
      where: {
        raterId: session.userId,
        targetUserId: parsed.targetUserId,
        matchId,
        contextRole,
      },
    });

    const saved = existing
      ? await prisma.userRating.update({
          where: { id: existing.id },
          data: {
            score: parsed.score,
            comment: parsed.comment ?? null,
          },
          include: {
            rater: { select: { id: true, fullName: true, profileImageUrl: true } },
            match: { select: { id: true, title: true } },
          },
        })
      : await prisma.userRating.create({
          data: {
            raterId: session.userId,
            targetUserId: parsed.targetUserId,
            matchId,
            contextRole,
            score: parsed.score,
            comment: parsed.comment ?? null,
          },
          include: {
            rater: { select: { id: true, fullName: true, profileImageUrl: true } },
            match: { select: { id: true, title: true } },
          },
        });

    await prisma.notification.create({
      data: {
        userId: parsed.targetUserId,
        type: NotificationType.GENERAL,
        title: `New ${parsed.score}★ Rating Received`,
        message: `${saved.rater.fullName} rated you ${parsed.score}/5${saved.match?.title ? ` for "${saved.match.title}"` : ''}.`,
        link:
          contextRole === RatingContext.PLAYER_TO_ORGANIZER
            ? '/organizer/profile'
            : '/player/profile',
      },
    }).catch(() => {});

    await Promise.allSettled([
      invalidateUserCache(parsed.targetUserId),
      matchId ? invalidateMatchesCache(matchId) : Promise.resolve(),
      recordAuditLog({
        userId: session.userId,
        action: 'USER_RATED',
        entityType: 'USER_RATING',
        entityId: saved.id,
        notes: `${contextRole}: ${parsed.score}/5 for user ${parsed.targetUserId}`,
        request,
      }),
    ]);

    return ok({
      id: saved.id,
      score: saved.score,
      comment: saved.comment,
      contextRole: saved.contextRole,
      raterName: saved.rater?.fullName || 'Member',
      matchTitle: saved.match?.title || null,
      createdAt: toEpoch(saved.createdAt),
    }, existing ? 200 : 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
