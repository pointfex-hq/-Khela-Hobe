import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { invalidateMatchesCache } from '@/lib/cache';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const session = await verifySession(request);
    if (!session) return fail('UNAUTHORIZED', 'Authentication required', 401);

    const { id: matchId, itemId } = await context.params;
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) return fail('RESOURCE_NOT_FOUND', 'Match not found', 404);

    if (match.organizerId !== session.userId && !session.roles.includes('ADMIN')) {
      return fail('ACCESS_DENIED', 'Only the match organizer can delete equipment items', 403);
    }

    await prisma.equipmentRequirement.delete({ where: { id: itemId } });
    await invalidateMatchesCache(matchId);
    return ok({ deleted: true, id: itemId });
  } catch (error) {
    return handleRouteError(error);
  }
}
