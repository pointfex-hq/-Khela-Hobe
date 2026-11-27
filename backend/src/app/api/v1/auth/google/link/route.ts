import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import { toUserDto, verifySession } from '@/lib/auth';
import { invalidateUserCache } from '@/lib/cache';

export async function DELETE(request: NextRequest) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, passwordHash: true, googleId: true },
    });

    if (!user) {
      return fail('RESOURCE_NOT_FOUND', 'User not found', 404);
    }

    if (!user.googleId) {
      return fail('BAD_REQUEST', 'No Google account is linked to this profile', 400);
    }

    if (!user.passwordHash) {
      return fail(
        'BAD_REQUEST',
        'Set an account password before unlinking Google so you do not lose access.',
        400
      );
    }

    const updated = await prisma.user.update({
      where: { id: session.userId },
      data: {
        googleId: null,
        googleEmail: null,
        googleLinkedAt: null,
      },
      include: {
        roles: true,
        playerProfile: {
          include: { safetyProfile: true },
        },
      },
    });

    const dto = toUserDto(updated);
    await invalidateUserCache(session.userId);
    return ok(dto);
  } catch (error) {
    return handleRouteError(error);
  }
}
