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

    const { page, size, skip } = parsePagination(request.url, 20);
    const where = { guardianId: session.userId };

    const [alerts, total] = await Promise.all([
      prisma.safetyAlert.findMany({
        where,
        skip,
        take: size,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.safetyAlert.count({ where }),
    ]);

    const items = alerts.map((a) => ({
      id: a.id,
      childId: a.childId,
      childName: a.childName,
      type: a.type,
      title: a.title,
      message: a.message ?? '',
      read: a.read,
      createdAt: toEpoch(a.createdAt),
    }));

    return ok(toPageResponse(items, page, size, total));
  } catch (error) {
    return handleRouteError(error);
  }
}
