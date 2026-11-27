import { NextRequest } from 'next/server';
import { z } from 'zod';
import { NotificationType } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok, toEpoch } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { sendPreferenceAwareEmail } from '@/lib/emailDispatcher';
import { guardianLinkRequestEmailTemplate } from '@/lib/emailTemplates';

const createLinkSchema = z.object({
  childSafetyId: z.string().trim().min(3, 'Safety ID is required').max(40),
  relationship: z.string().trim().min(1).max(50).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const body = await request.json();
    const parsed = createLinkSchema.parse(body);

    const normalizedSafetyId = parsed.childSafetyId.toUpperCase();
    let safetyProfile = await prisma.safetyProfile.findUnique({
      where: { safetyId: normalizedSafetyId },
      include: {
        playerProfile: {
          include: {
            user: {
              select: { id: true, fullName: true, profileImageUrl: true },
            },
          },
        },
      },
    });

    if (!safetyProfile && normalizedSafetyId.startsWith('KH-') && normalizedSafetyId.length >= 8) {
      const idSuffix = normalizedSafetyId.slice(3).toLowerCase();
      const matchedUser = await prisma.user.findFirst({
        where: { id: { endsWith: idSuffix } },
        include: { playerProfile: { include: { safetyProfile: true } } },
      });
      if (matchedUser) {
        if (!matchedUser.playerProfile) {
          await prisma.playerProfile.create({
            data: {
              userId: matchedUser.id,
              displayName: matchedUser.fullName,
              bio: matchedUser.bio,
              city: matchedUser.city || 'Dhaka',
              area: matchedUser.area,
              skillLevel: matchedUser.primarySkillLevel || 'INTERMEDIATE',
              safetyProfile: { create: { safetyId: normalizedSafetyId } },
            },
          });
        } else if (!matchedUser.playerProfile.safetyProfile) {
          await prisma.safetyProfile.create({
            data: {
              playerProfileId: matchedUser.playerProfile.id,
              safetyId: normalizedSafetyId,
            },
          });
        }
        safetyProfile = await prisma.safetyProfile.findUnique({
          where: { safetyId: normalizedSafetyId },
          include: {
            playerProfile: {
              include: {
                user: { select: { id: true, fullName: true, profileImageUrl: true } },
              },
            },
          },
        });
      }
    }

    if (!safetyProfile || !safetyProfile.playerProfile?.user) {
      return fail('RESOURCE_NOT_FOUND', 'No player found with that Safety ID', 404, [
        { field: 'childSafetyId', message: 'Invalid or unknown Safety ID' },
      ]);
    }

    const childUser = safetyProfile.playerProfile.user;
    const myProfile = await prisma.playerProfile.findUnique({
      where: { userId: session.userId },
      include: { safetyProfile: true },
    });
    const myFallbackSafetyId = `KH-${session.userId.slice(-8).toUpperCase()}`;
    const mySafetyId = (myProfile?.safetyProfile?.safetyId || myFallbackSafetyId).toUpperCase();

    if (childUser.id === session.userId || normalizedSafetyId === mySafetyId) {
      return fail('BAD_REQUEST', 'You cannot enter your own Safety ID to link to your own account.', 400);
    }

    const existing = await prisma.guardianLinkRequest.findFirst({
      where: {
        guardianId: session.userId,
        childId: childUser.id,
        status: { notIn: ['REVOKED', 'REJECTED'] },
      },
    });

    if (existing) {
      return fail('CONFLICT', 'A link or pending request already exists for this player', 409);
    }

    const relationshipLabel = parsed.relationship || 'Guardian';

    const link = await prisma.$transaction(async (tx) => {
      const reqRecord = await tx.guardianLinkRequest.create({
        data: {
          requestId: `LNK-${Date.now()}`,
          guardianId: session.userId,
          childId: childUser.id,
          status: 'PENDING',
          guardianConsent: true,
          childConsent: false,
          linkedProfileId: safetyProfile.playerProfile.id,
        },
      });

      await tx.guardianRelationship.upsert({
        where: {
          guardianId_childId_active: {
            guardianId: session.userId,
            childId: childUser.id,
            active: true,
          },
        },
        update: {
          relationship: relationshipLabel,
        },
        create: {
          guardianId: session.userId,
          childId: childUser.id,
          relationship: relationshipLabel,
          permissions: ['VIEW_ACTIVITY', 'SAFETY_SETTINGS'],
          active: true,
        },
      });

      await tx.childSafetySettings.upsert({
        where: {
          guardianId_childId: {
            guardianId: session.userId,
            childId: childUser.id,
          },
        },
        update: {},
        create: {
          guardianId: session.userId,
          childId: childUser.id,
          allowMatchParticipation: true,
          requireGuardianApproval: true,
          allowLocationSharing: false,
        },
      });

      await tx.notification.create({
        data: {
          userId: childUser.id,
          type: NotificationType.GUARDIAN_LINK_REQUEST,
          title: 'Guardian Link Request',
          message: 'A guardian initiated a Safety ID link request with your account.',
          link: '/player/profile',
        },
      });

      await tx.safetyAlert.create({
        data: {
          guardianId: session.userId,
          childId: childUser.id,
          childName: childUser.fullName,
          type: 'LINK_REQUEST',
          title: 'Guardian Link Initiated',
          message: `Link request sent to ${childUser.fullName} (${normalizedSafetyId}).`,
          read: false,
        },
      });

      return reqRecord;
    });

    const guardianUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { fullName: true },
    });
    const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
    const tpl = guardianLinkRequestEmailTemplate({
      recipientName: childUser.fullName,
      guardianName: guardianUser?.fullName || 'A Khela Hobe Guardian',
      safetyId: normalizedSafetyId,
      profileUrl: `${frontendBase}/player/profile`,
    });
    await sendPreferenceAwareEmail({
      userId: childUser.id,
      preferenceKey: 'emailSafety',
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
    });

    return ok(
      {
        id: link.id,
        childId: childUser.id,
        childDisplayName: childUser.fullName,
        childSafetyId: normalizedSafetyId,
        relationship: relationshipLabel,
        status: 'PENDING',
        isVerified: false,
        createdAt: toEpoch(link.createdAt),
      },
      201
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
