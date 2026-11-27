import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok, parsePagination, toEpoch, toPageResponse } from '@/lib/http';
import { verifySession } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { id } = await context.params;
    const link = await prisma.guardianLinkRequest.findFirst({
      where: {
        guardianId: session.userId,
        OR: [{ childId: id }, { id }],
        status: { notIn: ['REVOKED', 'REJECTED'] },
      },
    });

    if (!link) {
      return fail('ACCESS_DENIED', 'No guardian link found for this child', 403);
    }

    const { page, size, skip } = parsePagination(request.url, 20);
    if (link.status !== 'VERIFIED') {
      return ok(toPageResponse([], page, size, 0));
    }

    const [participations, total] = await Promise.all([
      prisma.matchParticipant.findMany({
        where: { userId: link.childId, leftAt: null },
        skip,
        take: size,
        orderBy: { joinedAt: 'desc' },
        include: {
          match: {
            select: { title: true, locationName: true, city: true, startTime: true },
          },
        },
      }),
      prisma.matchParticipant.count({ where: { userId: link.childId, leftAt: null } }),
    ]);

    const items = participations.map((p) => ({
      id: p.id,
      activityType: p.match.locationName || p.match.city || 'Authorized Match',
      description: `Joined "${p.match.title}"`,
      timestamp: toEpoch(p.joinedAt),
    }));

    return ok(toPageResponse(items, page, size, total));
  } catch (error) {
    return handleRouteError(error);
  }
}
