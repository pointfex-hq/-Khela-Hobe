import { NextRequest } from 'next/server';
import { ApplicationStatus } from '@prisma/client';
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
    const app = await prisma.matchApplication.findUnique({ where: { id } });
    if (!app) {
      return fail('RESOURCE_NOT_FOUND', 'Application not found', 404);
    }

    if (app.userId !== session.userId) {
      return fail('ACCESS_DENIED', 'You can only withdraw your own application', 403);
    }

    await prisma.matchApplication.update({
      where: { id },
      data: { status: ApplicationStatus.WITHDRAWN },
    });

    return ok({ withdrawn: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
