import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { handleRouteError, ok, parsePagination, toPageResponse } from '@/lib/http';
import { toMatchDto } from '@/lib/mappers';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const { page, size, skip } = parsePagination(request.url, 20);

    const where = {
      OR: [
        { organizerId: userId },
        {
          participants: {
            some: {
              userId,
              status: { in: ['CONFIRMED' as const, 'PENDING' as const] },
            },
          },
        },
      ],
    };

    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where,
        skip,
        take: size,
        orderBy: { startTime: 'desc' },
        include: {
          sport: true,
          organizer: { select: { id: true, fullName: true, profileImageUrl: true } },
          venue: true,
          participants: { select: { status: true } },
        },
      }),
      prisma.match.count({ where }),
    ]);

    return ok(toPageResponse(matches.map(toMatchDto), page, size, total));
  } catch (error) {
    return handleRouteError(error);
  }
}
