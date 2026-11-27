import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import { verifySession } from '@/lib/auth';

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
    const alert = await prisma.safetyAlert.findFirst({
      where: { id, guardianId: session.userId },
    });
    if (!alert) {
      return fail('RESOURCE_NOT_FOUND', 'Safety alert not found', 404);
    }

    await prisma.safetyAlert.update({
      where: { id },
      data: { read: true },
    });

    return ok({ id, read: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
