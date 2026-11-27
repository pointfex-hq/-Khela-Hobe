import { NextRequest } from 'next/server';
import { z } from 'zod';
import { VenueType } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { toVenueDto } from '@/lib/mappers';
import { invalidateLocationsCache } from '@/lib/cache';

const createVenueSchema = z.object({
  name: z.string().trim().min(2).max(150),
  venueType: z.enum(['TURF', 'STADIUM', 'PLAYGROUND', 'INDOOR_COURT', 'FIELD']).optional(),
  zoneId: z.string().trim().optional().nullable(),
  address: z.string().trim().min(2).max(255),
  city: z.string().trim().min(2).max(100),
  area: z.string().trim().max(100).optional().nullable(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  description: z.string().trim().max(1000).optional().nullable(),
  facilities: z.string().trim().max(500).optional().nullable(),
  pricePerHour: z.number().min(0).max(100000).optional().nullable(),
  coverImageUrl: z.string().trim().max(1000).optional().nullable(),
  isTurf: z.boolean().optional(),
  active: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }
    if (!session.roles.includes('ADMIN')) {
      return fail('ACCESS_DENIED', 'Admin privileges required', 403);
    }

    const venues = await prisma.venue.findMany({
      orderBy: [{ city: 'asc' }, { name: 'asc' }],
    });

    return ok(venues.map(toVenueDto));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }
    if (!session.roles.includes('ADMIN')) {
      return fail('ACCESS_DENIED', 'Admin privileges required', 403);
    }

    const body = await request.json();
    const parsed = createVenueSchema.parse(body);

    const venueType = (parsed.venueType ||
      (parsed.isTurf ? 'TURF' : 'PLAYGROUND')) as VenueType;

    const created = await prisma.venue.create({
      data: {
        name: parsed.name,
        venueType,
        zoneId: parsed.zoneId ?? null,
        address: parsed.address,
        city: parsed.city,
        area: parsed.area ?? null,
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        description: parsed.description ?? null,
        facilities: parsed.facilities ?? null,
        pricePerHour: parsed.pricePerHour ?? null,
        coverImageUrl: parsed.coverImageUrl ?? null,
        isTurf: venueType === 'TURF',
        active: parsed.active ?? true,
      },
    });

    await invalidateLocationsCache();
    return ok(toVenueDto(created), 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
