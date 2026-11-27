import { NextRequest } from 'next/server';
import { z } from 'zod';
import { NotificationType, ParticipantStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { toParticipantDto } from '@/lib/mappers';
import { invalidateMatchesCache, invalidateUserCache } from '@/lib/cache';

const noShowSchema = z.object({
  noShow: z.boolean().default(true),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; participantId: string }> }
) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { id: matchId, participantId } = await context.params;
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { id: true, title: true, organizerId: true },
    });

    if (!match) {
      return fail('RESOURCE_NOT_FOUND', 'Match not found', 404);
    }

    const isAdmin = session.roles.includes('ADMIN');
    if (match.organizerId !== session.userId && !isAdmin) {
      return fail('ACCESS_DENIED', 'Only the match organizer can mark attendance', 403);
    }

    const participant = await prisma.matchParticipant.findUnique({
      where: { id: participantId },
    });

    if (!participant || participant.matchId !== matchId || participant.leftAt) {
      return fail('RESOURCE_NOT_FOUND', 'Participant not found for this match', 404);
    }

    const body = await request.json().catch(() => ({}));
    const parsed = noShowSchema.parse(body);

    const nextStatus = parsed.noShow ? ParticipantStatus.NO_SHOW : ParticipantStatus.CONFIRMED;
    const updated = await prisma.matchParticipant.update({
      where: { id: participantId },
      data: { status: nextStatus },
      include: {
        user: { select: { fullName: true, profileImageUrl: true } },
      },
    });

    if (parsed.noShow) {
      await prisma.notification.create({
        data: {
          userId: participant.userId,
          type: NotificationType.GENERAL,
          title: 'Match Attendance Updated',
          message: `You were marked as "Did Not Show Up" for "${match.title}". This affects your show-up rate.`,
          link: '/profile',
        },
      });
    }

    await Promise.all([
      invalidateMatchesCache(matchId),
      invalidateUserCache(participant.userId),
    ]);

    return ok(toParticipantDto(updated));
  } catch (error) {
    return handleRouteError(error);
  }
}
