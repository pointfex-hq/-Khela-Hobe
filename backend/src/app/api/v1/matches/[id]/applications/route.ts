import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { toApplicationDto } from '@/lib/mappers';

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
    const match = await prisma.match.findUnique({ where: { id } });
    if (!match) {
      return fail('RESOURCE_NOT_FOUND', 'Match not found', 404);
    }

    const isAdmin = session.roles.includes('ADMIN');
    if (match.organizerId !== session.userId && !isAdmin) {
      return fail('ACCESS_DENIED', 'Only the match organizer can review applications', 403);
    }

    const applications = await prisma.matchApplication.findMany({
      where: { matchId: id },
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
