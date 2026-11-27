import { NextRequest } from 'next/server';
import { z } from 'zod';
import { NotificationType, OrganizerApprovalStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import {
  getEnrichedUserProfile,
  MIN_MATCHES_FOR_ORGANIZER_APPLY,
  verifySession,
} from '@/lib/auth';
import { invalidateUserCache } from '@/lib/cache';
import { recordAuditLog } from '@/lib/audit';

const applySchema = z.object({
  note: z.string().trim().max(500).optional(),
  organization: z.string().trim().max(150).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { roles: true },
    });
    if (!user) {
      return fail('RESOURCE_NOT_FOUND', 'User not found', 404);
    }

    if (!user.emailVerified && !user.googleId) {
      return fail(
        'ACCESS_DENIED',
        'Please verify your email address before applying for Full Organizer access.',
        403
      );
    }

    const hasOrg = user.roles.some((r) => r.role === 'ORGANIZER');
    if (hasOrg && user.organizerApprovalStatus === 'APPROVED') {
      return fail('CONFLICT', 'Your account already has Full Organizer privileges.', 409);
    }
    if (user.organizerApprovalStatus === 'PENDING') {
      return fail('CONFLICT', 'Your Organizer upgrade application is already pending Admin review.', 409);
    }

    const now = new Date();
    const completedHostedMatches = await prisma.match.count({
      where: {
        organizerId: session.userId,
        status: { not: 'CANCELLED' },
        OR: [{ status: 'COMPLETED' }, { endTime: { lte: now } }],
      },
    });

    if (completedHostedMatches < MIN_MATCHES_FOR_ORGANIZER_APPLY) {
      return fail(
        'BAD_REQUEST',
        `Complete at least ${MIN_MATCHES_FOR_ORGANIZER_APPLY} successful quick matches before applying for Full Organizer access (current progress: ${completedHostedMatches}/${MIN_MATCHES_FOR_ORGANIZER_APPLY}).`,
        400
      );
    }

    const body = await request.json().catch(() => ({}));
    const parsed = applySchema.parse(body);

    const combinedNote = [parsed.organization, parsed.note].filter(Boolean).join(' — ') ||
      `Completed ${completedHostedMatches} hosted matches; applying for Full Organizer access.`;

    await prisma.user.update({
      where: { id: session.userId },
      data: {
        organizerApprovalStatus: OrganizerApprovalStatus.PENDING,
        organizerApprovalNote: combinedNote,
      },
    });

    const admins = await prisma.userRoleAssignment.findMany({
      where: { role: 'ADMIN' },
      select: { userId: true },
    });
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((a) => ({
          userId: a.userId,
          type: NotificationType.GENERAL,
          title: 'Player Applied for Organizer Access',
          message: `${user.fullName} (${user.email}) completed ${completedHostedMatches} hosted matches and requested Full Organizer access.`,
          link: '/admin/users?tab=approvals',
        })),
      });
    }

    await invalidateUserCache(session.userId);
    await recordAuditLog({
      userId: session.userId,
      action: 'ORGANIZER_UPGRADE_APPLIED',
      entityType: 'USER',
      entityId: session.userId,
      notes: combinedNote,
      request,
    });

    const dto = await getEnrichedUserProfile(session.userId);
    return ok(dto, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
