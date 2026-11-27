import { NextRequest } from 'next/server';
import { MatchStatus, ParticipantStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import { verifySession } from '@/lib/auth';
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

    const participant = await prisma.matchParticipant.findFirst({
      where: {
        matchId: id,
        userId: session.userId,
        status: { in: [ParticipantStatus.CONFIRMED, ParticipantStatus.PENDING, ParticipantStatus.WAITLISTED] },
        leftAt: null,
      },
    });

    if (!participant) {
      return fail('RESOURCE_NOT_FOUND', 'You are not an active participant in this match', 404);
    }

    await prisma.$transaction(async (tx) => {
      await tx.matchParticipant.update({
        where: { id: participant.id },
        data: {
          status: ParticipantStatus.LEFT,
          leftAt: new Date(),
        },
      });

      const match = await tx.match.findUnique({ where: { id } });
      if (match && match.status === MatchStatus.FULL) {
        const remainingConfirmed = await tx.matchParticipant.count({
          where: { matchId: id, status: ParticipantStatus.CONFIRMED, leftAt: null },
        });
        if (remainingConfirmed < match.capacity) {
          await tx.match.update({
            where: { id },
            data: { status: MatchStatus.OPEN },
          });
        }
      }
    });

    await invalidateMatchesCache(id);
    return ok({ left: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
