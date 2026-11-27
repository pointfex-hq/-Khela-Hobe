import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { toApplicationDto } from '@/lib/mappers';

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const applications = await prisma.matchApplication.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        match: { select: { title: true } },
        user: { select: { fullName: true, profileImageUrl: true } },
      },
    });

    return ok(applications.map(toApplicationDto));
  } catch (error) {
    return handleRouteError(error);
  }
}
