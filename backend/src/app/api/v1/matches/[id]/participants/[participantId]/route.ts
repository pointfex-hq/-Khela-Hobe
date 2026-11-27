import { NextRequest } from 'next/server';
import { MatchStatus, ParticipantStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { invalidateMatchesCache } from '@/lib/cache';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; participantId: string }> }
) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { id, participantId } = await context.params;
    const match = await prisma.match.findUnique({ where: { id } });
    if (!match) {
      return fail('RESOURCE_NOT_FOUND', 'Match not found', 404);
    }

    const participant = await prisma.matchParticipant.findFirst({
      where: {
        matchId: id,
        OR: [{ id: participantId }, { userId: participantId }],
        leftAt: null,
      },
    });
    if (!participant) {
      return fail('RESOURCE_NOT_FOUND', 'Participant not found', 404);
    }

    const isAdmin = session.roles.includes('ADMIN');
    if (
      match.organizerId !== session.userId &&
      participant.userId !== session.userId &&
      !isAdmin
    ) {
      return fail('ACCESS_DENIED', 'Not authorized to remove this participant', 403);
    }

    await prisma.$transaction(async (tx) => {
      await tx.matchParticipant.update({
        where: { id: participant.id },
        data: { status: ParticipantStatus.LEFT, leftAt: new Date() },
      });

      if (match.status === MatchStatus.FULL) {
        const remaining = await tx.matchParticipant.count({
          where: { matchId: id, status: ParticipantStatus.CONFIRMED, leftAt: null },
        });
        if (remaining < match.capacity) {
          await tx.match.update({ where: { id }, data: { status: MatchStatus.OPEN } });
        }
      }
    });

    await invalidateMatchesCache(id);
    return ok({ removed: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
