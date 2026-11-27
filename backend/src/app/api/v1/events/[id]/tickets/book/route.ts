import { NextRequest } from 'next/server';
import { z } from 'zod';
import { NotificationType, TicketStatus, TournamentStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok, toEpoch } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { invalidateTournamentsCache } from '@/lib/cache';
import { sendPreferenceAwareEmail } from '@/lib/emailDispatcher';
import { ticketBookingEmailTemplate } from '@/lib/emailTemplates';
import {
  computeTournamentExpiry,
  generateTicketCode,
  resolveSafetyId,
  validateAndComputeCoupon,
} from '@/lib/tickets';

const bookTicketSchema = z.object({
  tierId: z.string().trim().optional().default('general'),
  quantity: z.number().int().min(1).max(20).optional().default(1),
  couponCode: z.string().trim().max(40).optional().nullable(),
  attendeeName: z.string().trim().min(2).max(120).optional(),
  attendeePhone: z.string().trim().min(5).max(30).optional(),
  attendeeEmail: z.string().trim().email().max(150).optional().nullable(),
  issueToSafetyId: z.string().trim().optional(),
  complimentary: z.boolean().optional().default(false),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Please sign in to book or issue tickets', 401);
    }

    const { id } = await context.params;
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        tickets: { where: { status: { not: 'CANCELLED' } }, select: { id: true } },
      },
    });

    if (!tournament) {
      return fail('RESOURCE_NOT_FOUND', 'Tournament not found', 404);
    }

    const body = await request.json();
    const parsed = bookTicketSchema.parse(body);
    const isOrganizerOrAdmin =
      tournament.organizerId === session.userId || session.roles.includes('ADMIN');

    const isDirectIssue = Boolean(parsed.issueToSafetyId && isOrganizerOrAdmin);

    if (!isDirectIssue && tournament.status !== TournamentStatus.APPROVED) {
      return fail('BAD_REQUEST', 'Tournament is not open for ticket booking', 400);
    }
    if (!isDirectIssue && tournament.spectatorMode === 'NONE') {
      return fail('BAD_REQUEST', 'Spectator tickets are closed for this tournament', 400);
    }

    if (
      tournament.spectatorMode === 'LIMITED_TICKETS' &&
      tournament.tickets.length + parsed.quantity > tournament.spectatorCapacity
    ) {
      return fail('BAD_REQUEST', 'Not enough spectator seats left for this quantity', 400);
    }

    let recipientUserId = session.userId;
    let attendeeName = parsed.attendeeName;
    let attendeePhone = parsed.attendeePhone;
    let attendeeEmail = parsed.attendeeEmail || null;

    if (isDirectIssue && parsed.issueToSafetyId) {
      const targetPlayer = await resolveSafetyId(parsed.issueToSafetyId);
      if (!targetPlayer) {
        return fail('RESOURCE_NOT_FOUND', `No player found with Safety ID "${parsed.issueToSafetyId}"`, 404);
      }
      recipientUserId = targetPlayer.id;
      attendeeName = attendeeName || targetPlayer.fullName;
      attendeePhone = attendeePhone || targetPlayer.phoneNumber || '+8801700000000';
      attendeeEmail = attendeeEmail || targetPlayer.email;
    } else {
      const buyer = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { fullName: true, phoneNumber: true, email: true },
      });
      attendeeName = attendeeName || buyer?.fullName || 'Spectator';
      attendeePhone = attendeePhone || buyer?.phoneNumber || '+8801700000000';
      attendeeEmail = attendeeEmail || buyer?.email || null;
    }

    const isVip = parsed.tierId === 'vip' && Boolean(tournament.vipTicketPrice);
    const tierName = isDirectIssue && parsed.complimentary
      ? 'Organizer Complimentary Pass'
      : isVip
        ? 'VIP Lounge & Seating Pass'
        : tournament.spectatorMode === 'OPEN_FREE'
          ? 'Open Spectator Pass'
          : 'General Spectator Pass';

    const unitPrice =
      isDirectIssue && parsed.complimentary
        ? 0
        : tournament.spectatorMode === 'LIMITED_TICKETS'
          ? isVip && tournament.vipTicketPrice
            ? tournament.vipTicketPrice
            : tournament.ticketPrice
          : 0;

    let pricing = {
      coupon: null as { code: string } | null,
      subtotal: unitPrice * parsed.quantity,
      discountAmount: 0,
      finalPrice: unitPrice * parsed.quantity,
    };

    if (parsed.couponCode && unitPrice > 0) {
      try {
        pricing = await validateAndComputeCoupon({
          tournamentId: tournament.id,
          couponCode: parsed.couponCode,
          userId: recipientUserId,
          unitPrice,
          quantity: parsed.quantity,
        });
      } catch (err) {
        return fail('COUPON_INVALID', err instanceof Error ? err.message : 'Invalid coupon', 400);
      }
    }

    const expiresAt = computeTournamentExpiry(tournament.startDate);
    const perTicketDiscount = Number((pricing.discountAmount / parsed.quantity).toFixed(2));
    const perTicketFinal = Math.max(0, Number((pricing.finalPrice / parsed.quantity).toFixed(2)));
    const isFree = pricing.finalPrice === 0;

    const createdTickets = [];
    for (let i = 0; i < parsed.quantity; i += 1) {
      const code = generateTicketCode();
      const row = await prisma.ticket.create({
        data: {
          ticketCode: code,
          tournamentId: tournament.id,
          userId: recipientUserId,
          issuedById: isDirectIssue ? session.userId : null,
          tierName,
          unitPrice,
          discountAmount: perTicketDiscount,
          finalPrice: perTicketFinal,
          couponCode: pricing.coupon?.code ?? null,
          paymentMethod: isFree ? 'FREE' : 'VENUE',
          paymentStatus: isFree ? 'PAID' : 'PAY_AT_VENUE',
          attendeeName,
          attendeePhone,
          attendeeEmail,
          status: isFree ? TicketStatus.PAID : TicketStatus.RESERVED,
          qrPayload: JSON.stringify({ code, tournamentId: tournament.id, tierName }),
          expiresAt,
        },
      });
      createdTickets.push(row);
    }

    if (pricing.coupon?.code) {
      await prisma.ticketCoupon.updateMany({
        where: { tournamentId: tournament.id, code: pricing.coupon.code },
        data: { usedCount: { increment: 1 } },
      });
    }

    if (isDirectIssue) {
      await prisma.notification.create({
        data: {
          userId: recipientUserId,
          type: NotificationType.GENERAL,
          title: 'Tournament Ticket Issued',
          message: `The organizer issued you ${parsed.quantity} ${tierName} ticket(s) for "${tournament.title}".`,
          link: '/player/tickets',
        },
      });
    }

    await invalidateTournamentsCache();

    const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
    const tpl = ticketBookingEmailTemplate({
      recipientName: attendeeName || 'Spectator',
      eventTitle: tournament.title,
      tierName,
      ticketCodes: createdTickets.map((t) => t.ticketCode),
      quantity: createdTickets.length,
      totalAmount: pricing.finalPrice,
      discountAmount: pricing.discountAmount,
      paymentStatus: isFree ? 'Confirmed / Free' : 'Pay at Venue Gate',
      venue: `${tournament.venueName}, ${tournament.area || tournament.city}`,
      schedule: `${tournament.startDate} • ${tournament.time}`,
      ticketsUrl: `${frontendBase}/player/tickets`,
    });
    await sendPreferenceAwareEmail({
      userId: recipientUserId,
      preferenceKey: 'emailTicketUpdates',
      toEmail: attendeeEmail,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
    });

    const first = createdTickets[0];
    return ok(
      {
        id: first.ticketCode,
        ticketId: first.id,
        ticketCodes: createdTickets.map((t) => t.ticketCode),
        tickets: createdTickets.map((t) => ({
          id: t.ticketCode,
          dbId: t.id,
          ticketCode: t.ticketCode,
          tierName: t.tierName,
          finalPrice: t.finalPrice,
          status: t.status,
          createdAt: toEpoch(t.createdAt),
        })),
        quantity: createdTickets.length,
        eventTitle: tournament.title,
        venue: tournament.venueName,
        schedule: `${tournament.startDate} • ${tournament.time}`,
        eventTier: tierName,
        totalPaid: pricing.finalPrice,
        discountAmount: pricing.discountAmount,
        paymentStatus: isFree ? 'Confirmed / Free' : 'Pay at Venue Gate',
      },
      201
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
