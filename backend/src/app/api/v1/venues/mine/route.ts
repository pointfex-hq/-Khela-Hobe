import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { toVenueDto } from '@/lib/mappers';

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const venues = await prisma.venue.findMany({
      where: { ownerId: session.userId, active: true },
      orderBy: { createdAt: 'desc' },
    });

    return ok(
      venues.map((v) => ({
        ...toVenueDto(v),
        description: v.description,
        isTurf: v.isTurf,
        coverImageUrl: v.coverImageUrl,
      }))
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
