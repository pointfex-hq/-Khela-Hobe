import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { toZoneDto } from '@/lib/mappers';
import { invalidateLocationsCache } from '@/lib/cache';

const updateZoneSchema = z.object({
  division: z.string().trim().min(2).max(80).optional(),
  city: z.string().trim().min(2).max(80).optional(),
  area: z.string().trim().min(2).max(100).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  zoom: z.number().int().min(8).max(18).optional(),
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
    const parsed = updateZoneSchema.parse(body);

    const updated = await prisma.zone.update({
      where: { id },
      data: {
        ...(parsed.division !== undefined ? { division: parsed.division } : {}),
        ...(parsed.city !== undefined ? { city: parsed.city } : {}),
        ...(parsed.area !== undefined ? { area: parsed.area, name: parsed.area } : {}),
        ...(parsed.latitude !== undefined ? { latitude: parsed.latitude } : {}),
        ...(parsed.longitude !== undefined ? { longitude: parsed.longitude } : {}),
        ...(parsed.zoom !== undefined ? { zoom: parsed.zoom } : {}),
        ...(parsed.active !== undefined ? { active: parsed.active } : {}),
      },
    });

    await invalidateLocationsCache();
    return ok(toZoneDto(updated));
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
    await prisma.zone.delete({ where: { id } });
    await invalidateLocationsCache();
    return ok({ deleted: true, id });
  } catch (error) {
    return handleRouteError(error);
  }
}
