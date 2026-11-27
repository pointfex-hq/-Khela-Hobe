import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { toParticipantDto } from '@/lib/mappers';

export async function POST(
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

    const isAdmin = session.roles.includes('ADMIN');
    if (match.organizerId !== session.userId && !isAdmin) {
      return fail('ACCESS_DENIED', 'Only the organizer can check in participants', 403);
    }

    const participant = await prisma.matchParticipant.findFirst({
      where: {
        matchId: id,
        OR: [{ id: participantId }, { userId: participantId }],
        leftAt: null,
      },
      include: {
        user: { select: { fullName: true, profileImageUrl: true } },
      },
    });
    if (!participant) {
      return fail('RESOURCE_NOT_FOUND', 'Participant not found', 404);
    }

    return ok({
      ...toParticipantDto(participant),
      checkedIn: true,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
