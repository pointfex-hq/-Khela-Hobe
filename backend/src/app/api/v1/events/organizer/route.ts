import { NextRequest } from 'next/server';
import { TournamentStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { toTournamentDto } from '@/lib/mappers';

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status')?.trim().toUpperCase();

    const where: Record<string, unknown> = {
      organizerId: session.userId,
    };

    if (
      statusParam &&
      statusParam !== 'ALL' &&
      ['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED'].includes(statusParam)
    ) {
      where.status = statusParam as TournamentStatus;
    }

    const tournaments = await prisma.tournament.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        organizer: { select: { id: true, fullName: true, profileImageUrl: true } },
        registrations: { select: { id: true, status: true } },
        interests: { select: { userId: true } },
        tickets: { where: { status: { not: 'CANCELLED' } }, select: { id: true, status: true } },
      },
    });

    return ok(tournaments.map((t) => toTournamentDto(t)));
  } catch (error) {
    return handleRouteError(error);
  }
}
