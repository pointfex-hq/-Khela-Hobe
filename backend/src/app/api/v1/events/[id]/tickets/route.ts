import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        tickets: {
          where: { status: { not: 'CANCELLED' } },
          select: { id: true, tierName: true },
        },
      },
    });

    if (!tournament) {
      return fail('RESOURCE_NOT_FOUND', 'Tournament not found', 404);
    }

    if (tournament.spectatorMode === 'NONE') {
      return ok({
        eventId: tournament.id,
        eventTitle: tournament.title,
        venue: tournament.venueName,
        schedule: `${tournament.startDate} • ${tournament.time}`,
        spectatorMode: tournament.spectatorMode,
        tiers: [],
      });
    }

    const totalSold = tournament.tickets.length;
    const isLimited = tournament.spectatorMode === 'LIMITED_TICKETS';
    const remainingTotal = isLimited
      ? Math.max(0, tournament.spectatorCapacity - totalSold)
      : 500;

    const tiers = [];
    if (isLimited) {
      tiers.push({
        id: 'general',
        name: 'General Spectator Pass',
        price: tournament.ticketPrice,
        description: 'Single-entry stadium / turf spectator pass',
        available: remainingTotal,
        maxPerOrder: Math.min(10, Math.max(1, remainingTotal)),
      });
      if (tournament.vipTicketPrice && tournament.vipTicketPrice > 0) {
        tiers.push({
          id: 'vip',
          name: 'VIP Lounge & Seating Pass',
          price: tournament.vipTicketPrice,
          description: 'Priority seating + hospitality access',
          available: remainingTotal,
          maxPerOrder: Math.min(6, Math.max(1, remainingTotal)),
        });
      }
    } else {
      tiers.push({
        id: 'free',
        name: 'Open Spectator Entry Pass',
        price: 0,
        description: 'Free public spectator gate pass',
        available: 500,
        maxPerOrder: 5,
      });
    }

    return ok({
      eventId: tournament.id,
      eventTitle: tournament.title,
      venue: `${tournament.venueName}, ${tournament.area || tournament.city}`,
      schedule: `${tournament.startDate} • ${tournament.time}`,
      spectatorMode: tournament.spectatorMode,
      spectatorCapacity: tournament.spectatorCapacity,
      ticketsSold: totalSold,
      remainingSeats: remainingTotal,
      tiers,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
