import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { invalidateTournamentsCache } from '@/lib/cache';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Please sign in to show interest in a tournament', 401);
    }

    const { id } = await context.params;
    const tournament = await prisma.tournament.findUnique({ where: { id }, select: { id: true } });
    if (!tournament) {
      return fail('RESOURCE_NOT_FOUND', 'Tournament not found', 404);
    }

    const existing = await prisma.tournamentInterest.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId: id,
          userId: session.userId,
        },
      },
    });

    let interested = false;
    if (existing) {
      await prisma.tournamentInterest.delete({ where: { id: existing.id } });
      interested = false;
    } else {
      await prisma.tournamentInterest.create({
        data: { tournamentId: id, userId: session.userId },
      });
      interested = true;
    }

    const interestCount = await prisma.tournamentInterest.count({
      where: { tournamentId: id },
    });

    await invalidateTournamentsCache();
    return ok({ interested, interestCount });
  } catch (error) {
    return handleRouteError(error);
  }
}
