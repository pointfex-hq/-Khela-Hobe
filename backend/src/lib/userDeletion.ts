import { NextRequest } from 'next/server';
import { UserRole } from '@prisma/client';
import prisma from '@/lib/prisma';
import { recordAuditLog } from '@/lib/audit';
import { invalidateUserSessions } from '@/lib/auth';
import {
  invalidateMatchesCache,
  invalidateTournamentsCache,
  invalidateUserCache,
} from '@/lib/cache';

export interface DeleteAccountResult {
  deleted: true;
  email: string;
  fullName: string;
}

/**
 * Safely deletes a user account and all blocking foreign-key references,
 * revoking active sessions, invalidating caches, and writing an audit log.
 */
export async function deleteUserAccountSafely({
  targetUserId,
  actorUserId,
  request,
  reason,
}: {
  targetUserId: string;
  actorUserId: string;
  request?: NextRequest;
  reason?: string;
}): Promise<DeleteAccountResult> {
  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: {
      roles: true,
      playerProfile: { select: { id: true } },
    },
  });

  if (!target) {
    throw { code: 'CUSTOM_NOT_FOUND', message: 'User account not found' };
  }

  const isTargetAdmin = target.roles.some((r) => r.role === UserRole.ADMIN);
  if (isTargetAdmin) {
    const adminCount = await prisma.userRoleAssignment.count({
      where: { role: UserRole.ADMIN },
    });
    if (adminCount <= 1) {
      throw {
        code: 'CUSTOM_BAD_REQUEST',
        message: 'Cannot delete the last remaining administrator account.',
      };
    }
  }

  await invalidateUserSessions(targetUserId).catch(() => {});

  await prisma.$transaction(async (tx) => {
    await tx.notificationPreference.deleteMany({
      where: { userId: targetUserId },
    });

    await tx.dependentProfile.deleteMany({
      where: { guardianId: targetUserId },
    });

    await tx.dependentGuardianLink.deleteMany({
      where: { guardianId: targetUserId },
    });

    await tx.playerGuardianLink.deleteMany({
      where: {
        OR: [
          { guardianId: targetUserId },
          ...(target.playerProfile?.id ? [{ playerProfileId: target.playerProfile.id }] : []),
        ],
      },
    });

    // Preserve organizer/venue references cleanly where needed
    await tx.match.deleteMany({
      where: { organizerId: targetUserId },
    });

    await tx.auditLog.updateMany({
      where: { userId: targetUserId },
      data: { userId: null },
    });

    await tx.user.delete({
      where: { id: targetUserId },
    });
  });

  await Promise.allSettled([
    invalidateUserCache(targetUserId),
    invalidateMatchesCache(),
    invalidateTournamentsCache(),
    recordAuditLog({
      userId: actorUserId === targetUserId ? null : actorUserId,
      action: actorUserId === targetUserId ? 'USER_SELF_DELETED' : 'USER_DELETED_BY_ADMIN',
      entityType: 'USER',
      entityId: targetUserId,
      notes:
        reason ||
        `${actorUserId === targetUserId ? 'User deleted their own account' : 'Admin deleted account'}: ${target.email}`,
      metadata: {
        deletedEmail: target.email,
        deletedName: target.fullName,
        deletedBySelf: actorUserId === targetUserId,
      },
      request,
    }),
  ]);

  return {
    deleted: true,
    email: target.email,
    fullName: target.fullName,
  };
}
