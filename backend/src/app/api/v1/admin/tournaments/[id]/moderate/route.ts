import { NextRequest } from 'next/server';
import { z } from 'zod';
import { NotificationType, TournamentStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { toTournamentDto } from '@/lib/mappers';
import { invalidateTournamentsCache } from '@/lib/cache';
import { broadcastAreaMatchAlert } from '@/lib/areaNotifications';
import { recordAuditLog } from '@/lib/audit';

const moderateSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  note: z.string().trim().max(500).optional().nullable(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }
    if (!session.roles.includes('ADMIN')) {
      return fail('ACCESS_DENIED', 'Admin privileges required', 403);
    }

    const { id } = await context.params;
    const tournament = await prisma.tournament.findUnique({ where: { id } });
    if (!tournament) {
      return fail('RESOURCE_NOT_FOUND', 'Tournament not found', 404);
    }

    const body = await request.json();
    const parsed = moderateSchema.parse(body);

    const isApprove = parsed.action === 'APPROVE';
    const nextStatus = isApprove ? TournamentStatus.APPROVED : TournamentStatus.REJECTED;

    const updated = await prisma.tournament.update({
      where: { id },
      data: {
        status: nextStatus,
        moderationNote: parsed.note ?? null,
        moderatedBy: session.userId,
        moderatedAt: new Date(),
      },
      include: {
        organizer: { select: { id: true, fullName: true, profileImageUrl: true } },
        registrations: { select: { id: true } },
      },
    });

    await prisma.notification.create({
      data: {
        userId: tournament.organizerId,
        type: NotificationType.GENERAL,
        title: isApprove ? 'Tournament Approved!' : 'Tournament Moderation Update',
        message: isApprove
          ? `Your tournament "${tournament.title}" was approved and is now live.`
          : `Your tournament "${tournament.title}" was not approved${parsed.note ? `: ${parsed.note}` : '.'}`,
        link: '/organizer/events',
      },
    });

    await invalidateTournamentsCache();
    await recordAuditLog({
      userId: session.userId,
      action: isApprove ? 'TOURNAMENT_APPROVED' : 'TOURNAMENT_REJECTED',
      entityType: 'TOURNAMENT',
      entityId: id,
      notes: `Admin ${parsed.action} tournament "${tournament.title}"`,
      request,
    });

    if (isApprove) {
      broadcastAreaMatchAlert({
        kind: 'Tournament',
        title: updated.title,
        sport: updated.sport,
        city: updated.city,
        area: updated.area,
        venue: updated.venueName,
        schedule: `${updated.startDate} • ${updated.time}`,
        link: `/events/${updated.id}`,
        excludeUserId: updated.organizerId,
      }).catch(() => {});
    }

    return ok(toTournamentDto(updated));
  } catch (error) {
    return handleRouteError(error);
  }
}
