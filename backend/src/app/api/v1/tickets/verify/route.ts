import { NextRequest } from 'next/server';
import { z } from 'zod';
import { NotificationType, TicketStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok, toEpoch } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';
import { invalidateTournamentsCache } from '@/lib/cache';
import { sendPreferenceAwareEmail } from '@/lib/emailDispatcher';
import { ticketCheckInEmailTemplate } from '@/lib/emailTemplates';

const verifySchema = z.object({
  code: z.string().trim().min(2),
  tournamentId: z.string().trim().optional(),
  autoCheckIn: z.boolean().optional().default(true),
});

function extractTicketCode(rawInput: string): string {
  const trimmed = rawInput.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsedJson = JSON.parse(trimmed) as { code?: string; ticketCode?: string };
      const extracted = parsedJson.code || parsedJson.ticketCode;
      if (extracted) return String(extracted).trim().toUpperCase();
    } catch {
      // Fall through to literal code
    }
  }
  return trimmed.toUpperCase();
}

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Organizer or admin authentication required', 401);
    }

    const body = await request.json();
    const parsed = verifySchema.parse(body);
    const cleanCode = extractTicketCode(parsed.code);

    const ticket = await prisma.ticket.findFirst({
      where: {
        OR: [{ ticketCode: cleanCode }, { id: parsed.code.trim() }],
      },
      include: {
        tournament: true,
      },
    });

    if (!ticket) {
      return ok({
        status: 'INVALID',
        message: 'Ticket code not found in database. Possible fake or mistyped pass.',
        data: null,
      });
    }

    if (
      ticket.tournament.organizerId !== session.userId &&
      !session.roles.includes('ADMIN')
    ) {
      return fail(
        'ACCESS_DENIED',
        'Only the tournament organizer or admin can verify this ticket',
        403
      );
    }

    if (parsed.tournamentId && ticket.tournamentId !== parsed.tournamentId) {
      return ok({
        status: 'INVALID',
        message: `Ticket belongs to a different tournament (${ticket.tournament.title}).`,
        data: null,
      });
    }

    const dto = {
      id: ticket.id,
      ticketCode: ticket.ticketCode,
      tournamentId: ticket.tournamentId,
      eventTitle: ticket.tournament.title,
      eventTier: ticket.tierName,
      attendeeName: ticket.attendeeName,
      attendeePhone: ticket.attendeePhone,
      attendeeEmail: ticket.attendeeEmail,
      fee: ticket.finalPrice > 0 ? `BDT ${ticket.finalPrice}` : 'Free Pass',
      couponCode: ticket.couponCode,
      paymentStatus: ticket.paymentStatus,
      status: ticket.status,
      checkInTime: toEpoch(ticket.checkedInAt),
      expiresAt: toEpoch(ticket.expiresAt),
    };

    if (ticket.status === 'USED') {
      return ok({
        status: 'ALREADY_USED',
        message: 'This ticket has already been scanned and used for gate entry.',
        data: dto,
      });
    }

    if (ticket.status === 'CANCELLED') {
      return ok({
        status: 'CANCELLED',
        message: 'This ticket was cancelled and is no longer valid.',
        data: dto,
      });
    }

    const isExpired =
      ticket.status === 'EXPIRED' ||
      (ticket.expiresAt && ticket.expiresAt < new Date()) ||
      ticket.tournament.status === 'CANCELLED';

    if (isExpired) {
      return ok({
        status: 'EXPIRED',
        message: 'This ticket has expired and cannot be admitted.',
        data: dto,
      });
    }

    if (parsed.autoCheckIn) {
      const checkedIn = await prisma.ticket.update({
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
            message: `Your pass ${checkedIn.ticketCode} for "${ticket.tournament.title}" was scanned and marked USED.`,
            link: '/player/tickets',
          },
        }).catch(() => {});
      }

      const tpl = ticketCheckInEmailTemplate({
        recipientName: checkedIn.attendeeName,
        eventTitle: ticket.tournament.title,
        ticketCode: checkedIn.ticketCode,
        tierName: checkedIn.tierName,
      });
      await sendPreferenceAwareEmail({
        userId: ticket.userId,
        preferenceKey: 'emailTicketUpdates',
        toEmail: checkedIn.attendeeEmail,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
      });

      await recordAuditLog({
        userId: session.userId,
        action: 'TICKET_VERIFIED_AND_USED',
        entityType: 'TICKET',
        entityId: checkedIn.id,
        notes: `Pass ${checkedIn.ticketCode} verified & checked in at gate for "${ticket.tournament.title}"`,
        request,
      });

      await invalidateTournamentsCache();

      return ok({
        status: 'CHECKED_IN_SUCCESS',
        message: `Valid ticket verified & marked USED for gate entry (${checkedIn.attendeeName})!`,
        data: {
          ...dto,
          status: checkedIn.status,
          paymentStatus: checkedIn.paymentStatus,
          checkInTime: toEpoch(checkedIn.checkedInAt),
        },
      });
    }

    return ok({
      status: 'VALID',
      message: 'Valid ticket verified from PostgreSQL! Ready for gate check-in.',
      data: dto,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
