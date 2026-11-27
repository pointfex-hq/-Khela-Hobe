import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import { toVenueDto } from '@/lib/mappers';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const venue = await prisma.venue.findUnique({ where: { id } });

    if (!venue) {
      return fail('RESOURCE_NOT_FOUND', 'Venue not found', 404);
    }

    return ok({
      ...toVenueDto(venue),
      description: venue.description,
      isTurf: venue.isTurf,
      coverImageUrl: venue.coverImageUrl,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
