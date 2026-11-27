import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import { verifySession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const items = await prisma.equipmentItem.findMany({
      where: { ownerId: session.userId },
      orderBy: { createdAt: 'desc' },
    });

    return ok(items);
  } catch (error) {
    return handleRouteError(error);
  }
}
