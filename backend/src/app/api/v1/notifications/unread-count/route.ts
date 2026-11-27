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

    const unreadCount = await prisma.notification.count({
      where: { userId: session.userId, read: false },
    });

    return ok({ unreadCount });
  } catch (error) {
    return handleRouteError(error);
  }
}
