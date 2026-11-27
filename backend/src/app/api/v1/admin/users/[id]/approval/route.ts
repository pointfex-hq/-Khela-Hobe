import { NextRequest } from 'next/server';
import { z } from 'zod';
import { NotificationType, OrganizerApprovalStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import { toUserDto, verifySession } from '@/lib/auth';
import { invalidateUserCache } from '@/lib/cache';
import { recordAuditLog } from '@/lib/audit';
import { sendEmail } from '@/lib/mailer';
import { organizerApprovalEmailTemplate } from '@/lib/emailTemplates';

const approvalSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED']),
  note: z.string().trim().max(500).optional().nullable(),
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
    const parsed = approvalSchema.parse(body);

    const existing = await prisma.user.findUnique({
      where: { id },
      include: { roles: true },
    });
    if (!existing) {
      return fail('RESOURCE_NOT_FOUND', 'User not found', 404);
    }

    const hasOrgRole = existing.roles.some((r) => r.role === 'ORGANIZER');
    if (!hasOrgRole && parsed.decision === 'APPROVED') {
      await prisma.userRoleAssignment.upsert({
        where: { userId_role: { userId: id, role: 'ORGANIZER' } },
        update: {},
        create: { userId: id, role: 'ORGANIZER', grantedBy: session.userId },
      });
    }

    const nextStatus =
      parsed.decision === 'APPROVED'
        ? OrganizerApprovalStatus.APPROVED
        : OrganizerApprovalStatus.REJECTED;

    const updated = await prisma.user.update({
      where: { id },
      data: {
        organizerApprovalStatus: nextStatus,
        organizerApprovalNote: parsed.note ?? null,
        organizerApprovedAt: new Date(),
        organizerApprovedBy: session.userId,
      },
      include: {
        roles: true,
        playerProfile: { include: { safetyProfile: true } },
      },
    });

    const isApproved = parsed.decision === 'APPROVED';

    await prisma.notification.create({
      data: {
        userId: updated.id,
        type: NotificationType.GENERAL,
        title: isApproved ? 'Organizer Account Approved!' : 'Organizer Verification Update',
        message: isApproved
          ? 'Your Organizer account has been verified by an Admin! You can now create Quick Matches and Tournaments.'
          : `Your Organizer verification request was not approved${parsed.note ? `: ${parsed.note}` : '.'}`,
        link: '/organizer/dashboard',
      },
    });

    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    const tpl = organizerApprovalEmailTemplate({
      name: updated.fullName,
      approved: isApproved,
      note: parsed.note,
      dashboardUrl: `${frontendUrl}/organizer/dashboard`,
    });
    sendEmail({
      to: updated.email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
    }).catch(() => {});

    await invalidateUserCache(id);
    await recordAuditLog({
      userId: session.userId,
      action: isApproved ? 'ORGANIZER_ACCOUNT_APPROVED' : 'ORGANIZER_ACCOUNT_REJECTED',
      entityType: 'USER',
      entityId: id,
      notes: `${updated.fullName} (${updated.email}) organizer approval -> ${nextStatus}${parsed.note ? ` | Note: ${parsed.note}` : ''}`,
      request,
    });

    return ok(toUserDto(updated));
  } catch (error) {
    return handleRouteError(error);
  }
}
