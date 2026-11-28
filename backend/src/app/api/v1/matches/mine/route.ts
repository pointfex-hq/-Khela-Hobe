import { NextRequest } from 'next/server';
import { MatchStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok, parsePagination, toPageResponse } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { toMatchDto } from '@/lib/mappers';

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { page, size, skip, searchParams } = parsePagination(request.url, 12);
    const paginate = searchParams.has('page') || searchParams.has('size');
    const statusParam = searchParams.get('status')?.trim().toUpperCase();
    const q = searchParams.get('q')?.trim();

    const where: Record<string, unknown> = {
      organizerId: session.userId,
    };

    if (
      statusParam &&
      statusParam !== 'ALL' &&
      ['OPEN', 'FULL', 'CLOSED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(statusParam)
    ) {
      where.status = statusParam as MatchStatus;
    }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { locationName: { contains: q, mode: 'insensitive' } },
        { area: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [matches, total, allOrganizerStatuses] = await Promise.all([
      prisma.match.findMany({
        where,
        ...(paginate ? { skip, take: size } : {}),
        orderBy: [{ startTime: 'desc' }, { createdAt: 'desc' }],
        include: {
          sport: true,
          organizer: { select: { id: true, fullName: true, profileImageUrl: true } },
          venue: true,
          participants: { select: { status: true } },
          equipmentRequirements: {
            orderBy: { createdAt: 'asc' },
            include: {
              contributions: {
                include: { user: { select: { id: true, fullName: true, profileImageUrl: true } } },
              },
            },
          },
        },
      }),
      prisma.match.count({ where }),
      prisma.match.groupBy({
        by: ['status'],
        where: { organizerId: session.userId },
        _count: { _all: true },
      }),
    ]);

    const counts: Record<string, number> = {
      total: 0,
      OPEN: 0,
      FULL: 0,
      CLOSED: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    for (const row of allOrganizerStatuses) {
      counts[row.status] = row._count._all;
      counts.total += row._count._all;
    }

    const content = matches.map(toMatchDto);

    return ok({
      ...toPageResponse(content, paginate ? page : 0, paginate ? size : Math.max(1, content.length), total),
      counts,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
