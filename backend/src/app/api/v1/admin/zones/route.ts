import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { toZoneDto } from '@/lib/mappers';
import { invalidateLocationsCache } from '@/lib/cache';

const createZoneSchema = z.object({
  division: z.string().trim().min(2).max(80).default('Dhaka'),
  city: z.string().trim().min(2).max(80),
  area: z.string().trim().min(2).max(100),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  zoom: z.number().int().min(8).max(18).optional(),
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

    const zones = await prisma.zone.findMany({
      orderBy: [{ division: 'asc' }, { city: 'asc' }, { area: 'asc' }],
    });

    return ok(zones.map(toZoneDto));
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
    const parsed = createZoneSchema.parse(body);

    const created = await prisma.zone.create({
      data: {
        name: parsed.area,
        division: parsed.division,
        city: parsed.city,
        area: parsed.area,
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        zoom: parsed.zoom ?? 14,
        active: parsed.active ?? true,
      },
    });

    await invalidateLocationsCache();
    return ok(toZoneDto(created), 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
