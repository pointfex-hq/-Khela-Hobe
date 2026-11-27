import { NextRequest } from 'next/server';
import { z } from 'zod';
import { VenueType } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { toVenueDto } from '@/lib/mappers';
import { invalidateLocationsCache } from '@/lib/cache';

const updateVenueSchema = z.object({
  name: z.string().trim().min(2).max(150).optional(),
  venueType: z.enum(['TURF', 'STADIUM', 'PLAYGROUND', 'INDOOR_COURT', 'FIELD']).optional(),
  zoneId: z.string().trim().optional().nullable(),
  address: z.string().trim().min(2).max(255).optional(),
  city: z.string().trim().min(2).max(100).optional(),
  area: z.string().trim().max(100).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  facilities: z.string().trim().max(500).optional().nullable(),
  pricePerHour: z.number().min(0).max(100000).optional().nullable(),
  coverImageUrl: z.string().trim().max(1000).optional().nullable(),
  active: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }
    if (!session.roles.includes('ADMIN')) {
      return fail('ACCESS_DENIED', 'Admin privileges required', 403);
    }

    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateVenueSchema.parse(body);

    const updated = await prisma.venue.update({
      where: { id },
      data: {
        ...(parsed.name !== undefined ? { name: parsed.name } : {}),
        ...(parsed.venueType !== undefined
          ? {
              venueType: parsed.venueType as VenueType,
              isTurf: parsed.venueType === 'TURF',
            }
          : {}),
        ...(parsed.zoneId !== undefined ? { zoneId: parsed.zoneId } : {}),
        ...(parsed.address !== undefined ? { address: parsed.address } : {}),
        ...(parsed.city !== undefined ? { city: parsed.city } : {}),
        ...(parsed.area !== undefined ? { area: parsed.area } : {}),
        ...(parsed.latitude !== undefined ? { latitude: parsed.latitude } : {}),
        ...(parsed.longitude !== undefined ? { longitude: parsed.longitude } : {}),
        ...(parsed.description !== undefined ? { description: parsed.description } : {}),
        ...(parsed.facilities !== undefined ? { facilities: parsed.facilities } : {}),
        ...(parsed.pricePerHour !== undefined ? { pricePerHour: parsed.pricePerHour } : {}),
        ...(parsed.coverImageUrl !== undefined ? { coverImageUrl: parsed.coverImageUrl } : {}),
        ...(parsed.active !== undefined ? { active: parsed.active } : {}),
      },
    });

    await invalidateLocationsCache();
    return ok(toVenueDto(updated));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }
    if (!session.roles.includes('ADMIN')) {
      return fail('ACCESS_DENIED', 'Admin privileges required', 403);
    }

    const { id } = await context.params;
    await prisma.venue.delete({ where: { id } });
    await invalidateLocationsCache();
    return ok({ deleted: true, id });
  } catch (error) {
    return handleRouteError(error);
  }
}
