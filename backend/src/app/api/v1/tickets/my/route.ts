import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok, parsePagination, toEpoch, toPageResponse } from '@/lib/http';
import { verifySession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { page, size, skip, searchParams } = parsePagination(request.url, 9);
    const paginate = searchParams.has('page') || searchParams.has('size');
    const where = { userId: session.userId };

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        ...(paginate ? { skip, take: size } : {}),
        orderBy: { createdAt: 'desc' },
        include: {
          tournament: {
            select: {
              id: true,
              title: true,
              venueName: true,
              city: true,
              area: true,
              startDate: true,
              time: true,
            },
          },
        },
      }),
      paginate ? prisma.ticket.count({ where }) : Promise.resolve(0),
    ]);

    const now = new Date();
    const dtos = tickets.map((t) => {
      const isExpired = Boolean(
        t.status !== 'USED' &&
          t.status !== 'CANCELLED' &&
          (t.status === 'EXPIRED' || (t.expiresAt && t.expiresAt < now))
      );
      const uiStatus =
        t.status === 'USED'
          ? 'Checked In'
          : t.status === 'CANCELLED'
            ? 'Cancelled'
            : isExpired
              ? 'Expired'
              : 'Reserved Pass';

      return {
        id: t.ticketCode,
        dbId: t.id,
        ticketCode: t.ticketCode,
        tournamentId: t.tournamentId,
        title: t.tournament.title,
        venue: `${t.tournament.venueName}, ${t.tournament.area || t.tournament.city}`,
        schedule: `${t.tournament.startDate} • ${t.tournament.time}`,
        eventTier: t.tierName,
        fee: t.finalPrice > 0 ? `BDT ${t.finalPrice}` : 'Free Pass',
        unitPrice: t.unitPrice,
        discountAmount: t.discountAmount,
        couponCode: t.couponCode,
        paymentStatus:
          t.paymentStatus === 'PAID'
            ? 'Paid / Verified'
            : 'Pay at Venue Gate',
        attendeeName: t.attendeeName,
        attendeePhone: t.attendeePhone,
        attendeeEmail: t.attendeeEmail,
        status: uiStatus,
        rawStatus: isExpired ? 'EXPIRED' : t.status,
        isCheckedIn: t.status === 'USED',
        qrPayload: t.qrPayload,
        checkedInAt: toEpoch(t.checkedInAt),
        createdAt: toEpoch(t.createdAt),
      };
    });

    return ok(paginate ? toPageResponse(dtos, page, size, total) : dtos);
  } catch (error) {
    return handleRouteError(error);
  }
}
