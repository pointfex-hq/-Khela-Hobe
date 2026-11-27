import { NextRequest } from 'next/server';
import { z } from 'zod';
import { LinkStatus, NotificationType } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok, toEpoch } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { invalidateUserCache } from '@/lib/cache';

const respondSchema = z.object({
  action: z.enum(['ACCEPT', 'REJECT']),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { id } = await context.params;
    const linkRequest = await prisma.guardianLinkRequest.findUnique({ where: { id } });

    if (!linkRequest || linkRequest.childId !== session.userId) {
      return fail('RESOURCE_NOT_FOUND', 'Guardian link request not found', 404);
    }

    const body = await request.json();
    const parsed = respondSchema.parse(body);

    const isAccept = parsed.action === 'ACCEPT';
    const nextStatus = isAccept ? LinkStatus.VERIFIED : LinkStatus.REJECTED;

    const [updated, childUser] = await Promise.all([
      prisma.guardianLinkRequest.update({
        where: { id },
        data: {
          status: nextStatus,
          childConsent: isAccept,
          verifiedAt: isAccept ? new Date() : null,
        },
      }),
      prisma.user.findUnique({
        where: { id: session.userId },
        select: { fullName: true },
      }),
    ]);

    if (!isAccept) {
      await prisma.guardianRelationship.updateMany({
        where: {
          guardianId: linkRequest.guardianId,
          childId: session.userId,
          active: true,
        },
        data: { active: false },
      });
    } else {
      await prisma.guardianRelationship.updateMany({
        where: {
          guardianId: linkRequest.guardianId,
          childId: session.userId,
        },
        data: { active: true },
      });
    }

    const playerName = childUser?.fullName || 'Player';
    await Promise.all([
      prisma.safetyAlert.create({
        data: {
          guardianId: linkRequest.guardianId,
          childId: session.userId,
          childName: playerName,
          type: isAccept ? 'LINK_VERIFIED' : 'LINK_REJECTED',
          title: isAccept ? 'Guardian Link Approved' : 'Guardian Link Declined',
          message: isAccept
            ? `${playerName} accepted your Guardian Safety ID link request.`
            : `${playerName} declined your Guardian Safety ID link request.`,
          read: false,
        },
      }),
      prisma.notification.create({
        data: {
          userId: linkRequest.guardianId,
          type: NotificationType.GUARDIAN_LINK_REQUEST,
          title: isAccept ? 'Guardian Link Approved' : 'Guardian Link Declined',
          message: isAccept
            ? `${playerName} accepted your Safety ID link request.`
            : `${playerName} declined your Safety ID link request.`,
          link: '/guardian/children',
        },
      }),
      invalidateUserCache(session.userId),
      invalidateUserCache(linkRequest.guardianId),
    ]);

    return ok({
      id: updated.id,
      status: updated.status,
      childConsent: updated.childConsent,
      verifiedAt: toEpoch(updated.verifiedAt),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
