import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok, parsePagination, toPageResponse } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { toNotificationDto } from '@/lib/mappers';

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { page, size, skip } = parsePagination(request.url, 20);
    const where = { userId: session.userId };

    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: size,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
    ]);

    return ok(toPageResponse(items.map(toNotificationDto), page, size, total));
  } catch (error) {
    return handleRouteError(error);
  }
}
