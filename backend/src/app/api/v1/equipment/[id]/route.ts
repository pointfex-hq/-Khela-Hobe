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
    const item = await prisma.equipmentItem.findUnique({ where: { id } });

    if (!item) {
      return fail('RESOURCE_NOT_FOUND', 'Equipment item not found', 404);
    }

    const isAdmin = session.roles.includes('ADMIN');
    if (item.ownerId !== session.userId && !isAdmin) {
      return fail('ACCESS_DENIED', 'You can only delete your own equipment items', 403);
    }

    await prisma.equipmentItem.delete({ where: { id } });
    return ok(null);
  } catch (error) {
    return handleRouteError(error);
  }
}
