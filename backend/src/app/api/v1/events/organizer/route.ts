import { NextRequest } from 'next/server';
import { TournamentStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok, parsePagination, toPageResponse } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { toTournamentDto } from '@/lib/mappers';

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { page, size, skip, searchParams } = parsePagination(request.url, 10);
    const paginate = searchParams.has('page') || searchParams.has('size');
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

    const [tournaments, total] = await Promise.all([
      prisma.tournament.findMany({
        where,
        ...(paginate ? { skip, take: size } : {}),
        orderBy: { createdAt: 'desc' },
        include: {
          organizer: { select: { id: true, fullName: true, profileImageUrl: true } },
          registrations: { select: { id: true, status: true } },
          interests: { select: { userId: true } },
          tickets: { where: { status: { not: 'CANCELLED' } }, select: { id: true, status: true } },
        },
      }),
      paginate ? prisma.tournament.count({ where }) : Promise.resolve(0),
    ]);

    const dtos = tournaments.map((t) => toTournamentDto(t));
    return ok(paginate ? toPageResponse(dtos, page, size, total) : dtos);
  } catch (error) {
    return handleRouteError(error);
  }
}
