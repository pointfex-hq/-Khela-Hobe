import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ApplicationStatus, MatchStatus, NotificationType, ParticipantStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { toApplicationDto } from '@/lib/mappers';

const applySchema = z.object({
  message: z.string().trim().max(1000).optional(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required to apply', 401);
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const parsed = applySchema.parse(body);

    const match = await prisma.match.findUnique({ where: { id } });
    if (!match) {
      return fail('RESOURCE_NOT_FOUND', 'Match not found', 404);
    }
    if (match.status === MatchStatus.CANCELLED || match.status === MatchStatus.COMPLETED) {
      return fail('BAD_REQUEST', 'Cannot apply to a cancelled or completed match', 400);
    }

    const alreadyJoined = await prisma.matchParticipant.findFirst({
      where: {
        matchId: id,
        userId: session.userId,
        status: ParticipantStatus.CONFIRMED,
        leftAt: null,
      },
    });
    if (alreadyJoined) {
      return fail('CONFLICT', 'You are already confirmed in this match', 409);
    }

    const existingApp = await prisma.matchApplication.findUnique({
      where: { matchId_userId: { matchId: id, userId: session.userId } },
    });

    if (existingApp && existingApp.status === ApplicationStatus.PENDING) {
      return fail('CONFLICT', 'You already have a pending application for this match', 409);
    }

    const application = existingApp
      ? await prisma.matchApplication.update({
          where: { id: existingApp.id },
          data: {
            message: parsed.message ?? null,
            status: ApplicationStatus.PENDING,
            reviewedAt: null,
            reviewedBy: null,
            reviewNote: null,
            rejectionReason: null,
          },
          include: {
            match: { select: { title: true } },
            user: { select: { fullName: true, profileImageUrl: true } },
          },
        })
      : await prisma.matchApplication.create({
          data: {
            matchId: id,
            userId: session.userId,
            message: parsed.message ?? null,
            status: ApplicationStatus.PENDING,
          },
          include: {
            match: { select: { title: true } },
            user: { select: { fullName: true, profileImageUrl: true } },
          },
        });

    if (match.organizerId !== session.userId) {
      await prisma.notification.create({
        data: {
          userId: match.organizerId,
          type: NotificationType.MATCH_APPLICATION_RECEIVED,
          title: 'New Match Application',
          message: `${application.user.fullName} applied to join "${match.title}".`,
          link: `/organizer/matches/${id}`,
        },
      });
    }

    return ok(toApplicationDto(application), 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
