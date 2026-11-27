import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok, toEpoch } from '@/lib/http';
import { verifySession } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession(request);
    if (!session) return fail('UNAUTHORIZED', 'Authentication required', 401);

    const { id } = await context.params;
    const tournament = await prisma.tournament.findUnique({ where: { id } });
    if (!tournament) return fail('RESOURCE_NOT_FOUND', 'Tournament not found', 404);

    if (tournament.organizerId !== session.userId && !session.roles.includes('ADMIN')) {
      return fail('ACCESS_DENIED', 'Only organizer or admin can inspect ticket registry', 403);
    }

    const tickets = await prisma.ticket.findMany({
      where: { tournamentId: id },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const mapped = tickets.map((t) => {
      const isExpired = Boolean(
        t.status !== 'USED' &&
          t.status !== 'CANCELLED' &&
          (t.status === 'EXPIRED' || (t.expiresAt && t.expiresAt < now))
      );
      return {
        id: t.id,
        ticketCode: t.ticketCode,
        tierName: t.tierName,
        attendeeName: t.attendeeName,
        attendeePhone: t.attendeePhone,
        attendeeEmail: t.attendeeEmail,
        unitPrice: t.unitPrice,
        discountAmount: t.discountAmount,
        finalPrice: t.finalPrice,
        couponCode: t.couponCode,
        paymentMethod: t.paymentMethod,
        paymentStatus: t.paymentStatus,
        status: isExpired ? 'EXPIRED' : t.status,
        checkedInAt: toEpoch(t.checkedInAt),
        expiresAt: toEpoch(t.expiresAt),
        createdAt: toEpoch(t.createdAt),
      };
    });

    const { searchParams } = new URL(request.url);
    if (searchParams.get('withSummary') !== '1') {
      return ok(mapped);
    }

    const activeTickets = mapped.filter((t) => t.status !== 'CANCELLED');
    const isLimited = tournament.spectatorMode === 'LIMITED_TICKETS';
    const totalCapacity = isLimited ? tournament.spectatorCapacity : null;
    const remainingTickets =
      totalCapacity !== null ? Math.max(0, totalCapacity - activeTickets.length) : null;

    let moneyEarned = 0;
    let pendingPaymentAmount = 0;
    let totalDiscountsGiven = 0;
    let paidTicketsCount = 0;
    let payAtVenueCount = 0;
    let freeTicketsCount = 0;
    let checkedInCount = 0;
    let expiredCount = 0;

    for (const tk of activeTickets) {
      totalDiscountsGiven += Number(tk.discountAmount || 0);
      if (tk.status === 'USED') checkedInCount += 1;
      if (tk.status === 'EXPIRED') expiredCount += 1;

      if (tk.paymentStatus === 'PAID') {
        moneyEarned += Number(tk.finalPrice || 0);
        if (Number(tk.finalPrice || 0) > 0) {
          paidTicketsCount += 1;
        } else {
          freeTicketsCount += 1;
        }
      } else if (tk.paymentStatus === 'PAY_AT_VENUE') {
        pendingPaymentAmount += Number(tk.finalPrice || 0);
        payAtVenueCount += 1;
      } else {
        freeTicketsCount += 1;
      }
    }

    const cancelledCount = mapped.filter((t) => t.status === 'CANCELLED').length;

    return ok({
      tickets: mapped,
      summary: {
        tournamentId: tournament.id,
        tournamentTitle: tournament.title,
        spectatorMode: tournament.spectatorMode,
        ticketPrice: tournament.ticketPrice,
        vipTicketPrice: tournament.vipTicketPrice,
        totalCapacity,
        totalSold: activeTickets.length,
        remainingTickets,
        paidTicketsCount,
        payAtVenueCount,
        freeTicketsCount,
        checkedInCount,
        expiredCount,
        cancelledCount,
        moneyEarned: Number(moneyEarned.toFixed(2)),
        pendingPaymentAmount: Number(pendingPaymentAmount.toFixed(2)),
        totalRevenue: Number((moneyEarned + pendingPaymentAmount).toFixed(2)),
        totalDiscountsGiven: Number(totalDiscountsGiven.toFixed(2)),
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
