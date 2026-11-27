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
    const link = await prisma.guardianLinkRequest.findFirst({
      where: {
        guardianId: session.userId,
        OR: [{ childId: id }, { id }],
        status: { not: 'REVOKED' },
      },
    });

    if (!link) {
      return fail('RESOURCE_NOT_FOUND', 'Linked child not found', 404);
    }

    await prisma.$transaction([
      prisma.guardianLinkRequest.update({
        where: { id: link.id },
        data: { status: 'REVOKED' },
      }),
      prisma.guardianRelationship.updateMany({
        where: { guardianId: session.userId, childId: link.childId, active: true },
        data: { active: false },
      }),
    ]);

    return ok({ revoked: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
