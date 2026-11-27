import { NextRequest } from 'next/server';
import { z } from 'zod';
import { UserStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import { invalidateUserSessions, toUserDto, verifySession } from '@/lib/auth';
import { invalidateUserCache } from '@/lib/cache';
import { recordAuditLog } from '@/lib/audit';

const statusSchema = z.object({
  active: z.boolean(),
});

export async function PATCH(
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
    const body = await request.json();
    const parsed = statusSchema.parse(body);

    const updated = await prisma.user.update({
      where: { id },
      data: {
        status: parsed.active ? UserStatus.ACTIVE : UserStatus.SUSPENDED,
      },
      include: {
        roles: true,
        playerProfile: { include: { safetyProfile: true } },
      },
    });

    if (!parsed.active) {
      await invalidateUserSessions(id);
    }
    await invalidateUserCache(id);
    await recordAuditLog({
      userId: session.userId,
      action: parsed.active ? 'USER_REACTIVATED' : 'USER_SUSPENDED',
      entityType: 'USER',
      entityId: id,
      notes: `Updated status for ${updated.email} -> ${updated.status}`,
      request,
    });

    return ok(toUserDto(updated));
  } catch (error) {
    return handleRouteError(error);
  }
}
