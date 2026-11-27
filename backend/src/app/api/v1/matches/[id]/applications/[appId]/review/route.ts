import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ApplicationStatus, MatchStatus, NotificationType, ParticipantStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { toApplicationDto } from '@/lib/mappers';
import { invalidateMatchesCache } from '@/lib/cache';
import { sendPreferenceAwareEmail } from '@/lib/emailDispatcher';
import { matchApplicationUpdateEmailTemplate } from '@/lib/emailTemplates';

const reviewSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reviewNote: z.string().trim().max(1000).optional(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; appId: string }> }
) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { id, appId } = await context.params;
    const body = await request.json();
    const parsed = reviewSchema.parse(body);

    const updated = await prisma.$transaction(async (tx) => {
      const match = await tx.match.findUnique({
        where: { id },
        include: {
          participants: { where: { status: ParticipantStatus.CONFIRMED, leftAt: null } },
        },
      });
      if (!match) {
        throw { code: 'CUSTOM_NOT_FOUND', message: 'Match not found' };
      }

      const isAdmin = session.roles.includes('ADMIN');
      if (match.organizerId !== session.userId && !isAdmin) {
        throw { code: 'CUSTOM_FORBIDDEN', message: 'Only the match organizer can review applications' };
      }

      const app = await tx.matchApplication.findFirst({
        where: { id: appId, matchId: id },
      });
      if (!app) {
        throw { code: 'CUSTOM_NOT_FOUND', message: 'Application not found' };
      }

      if (parsed.status === 'APPROVED') {
        const alreadyConfirmed = match.participants.some((p) => p.userId === app.userId);
        if (!alreadyConfirmed) {
          if (match.participants.length >= match.capacity) {
            throw { code: 'CUSTOM_BAD_REQUEST', message: 'Match has reached full capacity' };
          }
          await tx.matchParticipant.create({
            data: {
              matchId: id,
              userId: app.userId,
              status: ParticipantStatus.CONFIRMED,
            },
          });
          if (match.participants.length + 1 >= match.capacity && match.status === MatchStatus.OPEN) {
            await tx.match.update({ where: { id }, data: { status: MatchStatus.FULL } });
          }
        }
      }

      const reviewed = await tx.matchApplication.update({
        where: { id: app.id },
        data: {
          status:
            parsed.status === 'APPROVED' ? ApplicationStatus.APPROVED : ApplicationStatus.REJECTED,
          reviewedAt: new Date(),
          reviewedBy: session.userId,
          reviewNote: parsed.reviewNote ?? null,
          rejectionReason: parsed.status === 'REJECTED' ? parsed.reviewNote ?? null : null,
        },
        include: {
          match: { select: { title: true } },
          user: { select: { fullName: true, profileImageUrl: true } },
        },
      });

      await tx.notification.create({
        data: {
          userId: app.userId,
          type:
            parsed.status === 'APPROVED'
              ? NotificationType.MATCH_JOIN_CONFIRMED
              : NotificationType.MATCH_UPDATED,
          title:
            parsed.status === 'APPROVED' ? 'Application Approved' : 'Application Declined',
          message:
            parsed.status === 'APPROVED'
              ? `Your application to join "${match.title}" was approved!`
              : `Your application to join "${match.title}" was declined.`,
          link: `/matches/${id}`,
        },
      });

      return reviewed;
    });

    const dto = toApplicationDto(updated);
    await invalidateMatchesCache(id);

    const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
    const tpl = matchApplicationUpdateEmailTemplate({
      recipientName: updated.user?.fullName || 'Athlete',
      matchTitle: updated.match?.title || 'Match',
      approved: parsed.status === 'APPROVED',
      note: parsed.reviewNote,
      matchUrl: `${frontendBase}/matches/${id}`,
    });
    await sendPreferenceAwareEmail({
      userId: updated.userId,
      preferenceKey: 'emailApplication',
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
    });

    return ok(dto);
  } catch (error) {
    const custom = error as { code?: string; message?: string };
    if (custom?.code === 'CUSTOM_NOT_FOUND') {
      return fail('RESOURCE_NOT_FOUND', custom.message || 'Not found', 404);
    }
    if (custom?.code === 'CUSTOM_FORBIDDEN') {
      return fail('ACCESS_DENIED', custom.message || 'Forbidden', 403);
    }
    if (custom?.code === 'CUSTOM_BAD_REQUEST') {
      return fail('BAD_REQUEST', custom.message || 'Bad request', 400);
    }
    return handleRouteError(error);
  }
}
