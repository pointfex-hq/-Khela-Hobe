import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import { verifySession } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { id } = await context.params;
    const notif = await prisma.notification.findFirst({
      where: { id, userId: session.userId },
    });
    if (!notif) {
      return fail('RESOURCE_NOT_FOUND', 'Notification not found', 404);
    }

    await prisma.notification.delete({ where: { id } });
    return ok(null);
  } catch (error) {
    return handleRouteError(error);
  }
}
