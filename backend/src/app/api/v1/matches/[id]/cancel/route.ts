import { NextRequest } from 'next/server';
import { MatchStatus, NotificationType } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { toMatchDto } from '@/lib/mappers';
import { invalidateMatchesCache } from '@/lib/cache';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { id } = await context.params;
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        participants: {
          where: { status: { in: ['CONFIRMED', 'PENDING', 'WAITLISTED'] } },
          select: { userId: true },
        },
      },
    });

    if (!match) {
      return fail('RESOURCE_NOT_FOUND', 'Match not found', 404);
    }

    const isAdmin = session.roles.includes('ADMIN');
    if (match.organizerId !== session.userId && !isAdmin) {
      return fail('ACCESS_DENIED', 'Only the match organizer or admin can cancel this match', 403);
    }

    const updated = await prisma.match.update({
      where: { id },
      data: { status: MatchStatus.CANCELLED },
      include: {
        sport: true,
        organizer: { select: { id: true, fullName: true, profileImageUrl: true } },
        venue: true,
        participants: { select: { status: true } },
      },
    });

    await prisma.matchStatusHistory.create({
      data: {
        matchId: id,
        previousStatus: match.status,
        newStatus: MatchStatus.CANCELLED,
        changedBy: session.userId,
        notes: 'Match cancelled',
      },
    });

    const recipientIds = Array.from(
      new Set(match.participants.map((p) => p.userId).filter((uid) => uid !== session.userId))
    );

    if (recipientIds.length > 0) {
      await prisma.notification.createMany({
        data: recipientIds.map((userId) => ({
          userId,
          type: NotificationType.MATCH_CANCELLED,
          title: 'Match Cancelled',
          message: `"${match.title}" has been cancelled by the organizer.`,
          link: `/matches/${id}`,
        })),
      });
    }

    const dto = toMatchDto(updated);
    await invalidateMatchesCache(id);
    return ok(dto);
  } catch (error) {
    return handleRouteError(error);
  }
}
