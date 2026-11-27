import { NextRequest } from 'next/server';
import { fail, handleRouteError, ok } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { deleteUserAccountSafely } from '@/lib/userDeletion';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }
    if (!session.roles.includes('ADMIN')) {
      return fail('ACCESS_DENIED', 'Admin privileges required', 403);
    }

    const { id } = await context.params;
    if (id === session.userId) {
      return fail(
        'BAD_REQUEST',
        'Admins cannot delete their currently signed-in account from User Management.',
        400
      );
    }

    const result = await deleteUserAccountSafely({
      targetUserId: id,
      actorUserId: session.userId,
      request,
    });

    return ok(result);
  } catch (error) {
    const custom = error as { code?: string; message?: string };
    if (custom?.code === 'CUSTOM_NOT_FOUND') {
      return fail('RESOURCE_NOT_FOUND', custom.message || 'User not found', 404);
    }
    if (custom?.code === 'CUSTOM_BAD_REQUEST') {
      return fail('BAD_REQUEST', custom.message || 'Cannot delete account', 400);
    }
    return handleRouteError(error);
  }
}
