import { NextRequest } from 'next/server';
import { MatchStatus, NotificationType, ParticipantStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { toParticipantDto } from '@/lib/mappers';
import { invalidateMatchesCache } from '@/lib/cache';
import { sendPreferenceAwareEmail } from '@/lib/emailDispatcher';
import { matchJoinConfirmedEmailTemplate } from '@/lib/emailTemplates';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required to join a match', 401);
    }

    const { id } = await context.params;

    const participant = await prisma.$transaction(async (tx) => {
      const match = await tx.match.findUnique({
        where: { id },
        include: {
          participants: { where: { status: ParticipantStatus.CONFIRMED } },
        },
      });

      if (!match) {
        throw { code: 'CUSTOM_NOT_FOUND', message: 'Match not found' };
      }

      if (match.status === MatchStatus.CANCELLED || match.status === MatchStatus.COMPLETED) {
        throw { code: 'CUSTOM_BAD_REQUEST', message: 'Cannot join a cancelled or completed match' };
      }

      if (
        match.joinMode === 'APPLICATION_REQUIRED' ||
        match.joinMode === 'APPROVAL_REQUIRED'
      ) {
        throw {
          code: 'CUSTOM_BAD_REQUEST',
          message: 'This match requires organizer approval. Please submit an application.',
        };
      }

      const existing = match.participants.find((p) => p.userId === session.userId);
      if (existing) {
        throw { code: 'CUSTOM_CONFLICT', message: 'You have already joined this match' };
      }

      if (match.participants.length >= match.capacity) {
        throw { code: 'CUSTOM_BAD_REQUEST', message: 'This match is already full' };
      }

      const created = await tx.matchParticipant.create({
        data: {
          matchId: id,
          userId: session.userId,
          status: ParticipantStatus.CONFIRMED,
        },
        include: {
          user: { select: { fullName: true, profileImageUrl: true } },
        },
      });

      const newCount = match.participants.length + 1;
      if (newCount >= match.capacity && match.status === MatchStatus.OPEN) {
        await tx.match.update({
          where: { id },
          data: { status: MatchStatus.FULL },
        });
      }

      await tx.notification.create({
        data: {
          userId: session.userId,
          type: NotificationType.MATCH_JOIN_CONFIRMED,
          title: 'Match Joined',
          message: `You have confirmed your spot in "${match.title}".`,
          link: `/matches/${id}`,
        },
      });

      if (match.organizerId !== session.userId) {
        await tx.notification.create({
          data: {
            userId: match.organizerId,
            type: NotificationType.MATCH_JOIN_CONFIRMED,
            title: 'New Player Joined',
            message: `${created.user.fullName} joined "${match.title}".`,
            link: `/matches/${id}`,
          },
        });
      }

      return created;
    });

    const dto = toParticipantDto(participant);
    await invalidateMatchesCache(id);

    const matchDetails = await prisma.match.findUnique({
      where: { id },
      include: { sport: { select: { name: true } } },
    });
    if (matchDetails) {
      const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
      const tpl = matchJoinConfirmedEmailTemplate({
        recipientName: participant.user?.fullName || 'Athlete',
        matchTitle: matchDetails.title,
        sport: matchDetails.sport?.name || 'Sports',
        venue: `${matchDetails.locationName || matchDetails.locationAddress || 'Confirmed Venue'}, ${matchDetails.area || matchDetails.city}`,
        schedule: matchDetails.startTime.toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' }),
        feeText: matchDetails.feeAmount > 0 ? `BDT ${matchDetails.feeAmount} (Due at Venue)` : 'Free Match',
        matchUrl: `${frontendBase}/matches/${id}`,
      });
      await sendPreferenceAwareEmail({
        userId: session.userId,
        preferenceKey: 'emailMatchJoin',
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
      });
    }

    return ok(dto, 201);
  } catch (error) {
    const custom = error as { code?: string; message?: string };
    if (custom?.code === 'CUSTOM_NOT_FOUND') {
      return fail('RESOURCE_NOT_FOUND', custom.message || 'Match not found', 404);
    }
    if (custom?.code === 'CUSTOM_CONFLICT') {
      return fail('CONFLICT', custom.message || 'Already joined', 409);
    }
    if (custom?.code === 'CUSTOM_BAD_REQUEST') {
      return fail('BAD_REQUEST', custom.message || 'Unable to join match', 400);
    }
    return handleRouteError(error);
  }
}
