import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import { verifySession } from '@/lib/auth';

const settingsSchema = z.object({
  allowMatchParticipation: z.boolean(),
  requireGuardianApproval: z.boolean(),
  allowLocationSharing: z.boolean(),
});

async function assertGuardianLink(guardianId: string, childOrLinkId: string) {
  const link = await prisma.guardianLinkRequest.findFirst({
    where: {
      guardianId,
      OR: [{ childId: childOrLinkId }, { id: childOrLinkId }],
      status: { notIn: ['REVOKED', 'REJECTED'] },
    },
  });
  return link;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { id } = await context.params;
    const link = await assertGuardianLink(session.userId, id);
    if (!link) {
      return fail('ACCESS_DENIED', 'No active guardian link found for this child', 403);
    }

    const settings = await prisma.childSafetySettings.upsert({
      where: {
        guardianId_childId: {
          guardianId: session.userId,
          childId: link.childId,
        },
      },
      update: {},
      create: {
        guardianId: session.userId,
        childId: link.childId,
        allowMatchParticipation: true,
        requireGuardianApproval: true,
        allowLocationSharing: false,
      },
    });

    return ok(settings);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { id } = await context.params;
    const link = await assertGuardianLink(session.userId, id);
    if (!link) {
      return fail('ACCESS_DENIED', 'No active guardian link found for this child', 403);
    }

    const body = await request.json();
    const parsed = settingsSchema.parse(body);

    const updated = await prisma.childSafetySettings.upsert({
      where: {
        guardianId_childId: {
          guardianId: session.userId,
          childId: link.childId,
        },
      },
      update: {
        allowMatchParticipation: parsed.allowMatchParticipation,
        requireGuardianApproval: parsed.requireGuardianApproval,
        allowLocationSharing: parsed.allowLocationSharing,
      },
      create: {
        guardianId: session.userId,
        childId: link.childId,
        allowMatchParticipation: parsed.allowMatchParticipation,
        requireGuardianApproval: parsed.requireGuardianApproval,
        allowLocationSharing: parsed.allowLocationSharing,
      },
    });

    return ok(updated);
  } catch (error) {
    return handleRouteError(error);
  }
}
