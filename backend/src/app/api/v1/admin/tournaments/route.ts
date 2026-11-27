import { NextRequest } from 'next/server';
import { TournamentStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok, toEpoch } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { toTournamentDto } from '@/lib/mappers';

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }
    if (!session.roles.includes('ADMIN')) {
      return fail('ACCESS_DENIED', 'Admin privileges required', 403);
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status')?.trim().toUpperCase();

    const where: Record<string, unknown> = {};
    if (
      statusParam &&
      statusParam !== 'ALL' &&
      ['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED'].includes(statusParam)
    ) {
      where.status = statusParam as TournamentStatus;
    }

    const tournaments = await prisma.tournament.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      include: {
        organizer: { select: { id: true, fullName: true, email: true, profileImageUrl: true } },
        registrations: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            teamName: true,
            captainName: true,
            contactPhone: true,
            status: true,
            paymentStatus: true,
            createdAt: true,
          },
        },
        interests: { select: { userId: true } },
        tickets: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            ticketCode: true,
            tierName: true,
            finalPrice: true,
            attendeeName: true,
            paymentStatus: true,
            status: true,
            checkedInAt: true,
            createdAt: true,
          },
        },
      },
    });

    return ok(
      tournaments.map((t) => {
        const activeTickets = t.tickets.filter((tk) => tk.status !== 'CANCELLED');
        const usedTickets = activeTickets.filter((tk) => tk.status === 'USED');
        const ticketRevenue = activeTickets.reduce((sum, tk) => sum + (tk.finalPrice || 0), 0);

        return {
          ...toTournamentDto(t),
          organizerEmail: t.organizer?.email ?? null,
          ticketRevenue,
          checkedInTickets: usedTickets.length,
          recentTickets: t.tickets.slice(0, 20).map((tk) => ({
            id: tk.id,
            ticketCode: tk.ticketCode,
            tierName: tk.tierName,
            finalPrice: tk.finalPrice,
            attendeeName: tk.attendeeName,
            paymentStatus: tk.paymentStatus,
            status: tk.status,
            checkedInAt: toEpoch(tk.checkedInAt),
            createdAt: toEpoch(tk.createdAt),
          })),
          recentRegistrations: t.registrations.map((r) => ({
            id: r.id,
            teamName: r.teamName,
            captainName: r.captainName,
            phone: r.contactPhone,
            status: r.status,
            paymentStatus: r.paymentStatus,
            createdAt: toEpoch(r.createdAt),
          })),
        };
      })
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
