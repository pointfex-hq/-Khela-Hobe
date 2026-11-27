import { NextRequest } from 'next/server';
import { NotificationType, TicketStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok, toEpoch } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';
import { invalidateTournamentsCache } from '@/lib/cache';
import { sendPreferenceAwareEmail } from '@/lib/emailDispatcher';
import { ticketCheckInEmailTemplate } from '@/lib/emailTemplates';

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
    const ticket = await prisma.ticket.findFirst({
      where: {
        OR: [{ id }, { ticketCode: id }],
      },
      include: { tournament: true },
    });

    if (!ticket) {
      return fail('RESOURCE_NOT_FOUND', 'Ticket not found', 404);
    }

    if (
      ticket.tournament.organizerId !== session.userId &&
      !session.roles.includes('ADMIN')
    ) {
      return fail('ACCESS_DENIED', 'Only tournament organizer or admin can check in tickets', 403);
    }

    if (ticket.status === TicketStatus.USED) {
      return fail('CONFLICT', 'Ticket has already been used for check-in', 409);
    }
    if (ticket.status === TicketStatus.CANCELLED) {
      return fail('BAD_REQUEST', 'Cancelled tickets cannot be checked in', 400);
    }
    if (ticket.status === TicketStatus.EXPIRED || (ticket.expiresAt && ticket.expiresAt < new Date())) {
      return fail('BAD_REQUEST', 'Expired tickets cannot be checked in', 400);
    }

    const updated = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: TicketStatus.USED,
        paymentStatus: 'PAID',
        checkedInAt: new Date(),
        checkedInBy: session.userId,
      },
    });

    if (ticket.userId) {
      await prisma.notification.create({
        data: {
          userId: ticket.userId,
          type: NotificationType.GENERAL,
          title: 'Pass Checked In at Venue',
          message: `Your pass ${updated.ticketCode} for "${ticket.tournament.title}" was checked in and marked USED.`,
          link: '/player/tickets',
        },
      }).catch(() => {});
    }

    const tpl = ticketCheckInEmailTemplate({
      recipientName: updated.attendeeName,
      eventTitle: ticket.tournament.title,
      ticketCode: updated.ticketCode,
      tierName: updated.tierName,
    });
    await sendPreferenceAwareEmail({
      userId: ticket.userId,
      preferenceKey: 'emailTicketUpdates',
      toEmail: updated.attendeeEmail,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
    });

    await recordAuditLog({
      userId: session.userId,
      action: 'TICKET_CHECKED_IN',
      entityType: 'TICKET',
      entityId: updated.id,
      notes: `Manual gate check-in for ${updated.ticketCode}`,
      request,
    });

    await invalidateTournamentsCache();

    return ok({
      id: updated.id,
      ticketCode: updated.ticketCode,
      attendeeName: updated.attendeeName,
      eventTier: updated.tierName,
      checkInTime: toEpoch(updated.checkedInAt),
      status: updated.status,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
