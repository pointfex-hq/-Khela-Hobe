import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { toSportDto } from '@/lib/mappers';
import { invalidateMatchesCache, invalidateSportsCache } from '@/lib/cache';

const updateSportSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  slug: z.string().trim().min(2).max(100).optional(),
  iconUrl: z.string().trim().max(1000).optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
  playerCountMin: z.number().int().min(1).max(100).optional(),
  playerCountMax: z.number().int().min(1).max(100).optional(),
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
    const parsed = updateSportSchema.parse(body);

    const sport = await prisma.sport.update({
      where: { id },
      data: {
        ...(parsed.name !== undefined ? { name: parsed.name } : {}),
        ...(parsed.slug !== undefined ? { slug: parsed.slug } : {}),
        ...(parsed.iconUrl !== undefined ? { iconUrl: parsed.iconUrl } : {}),
        ...(parsed.description !== undefined ? { description: parsed.description } : {}),
        ...(parsed.playerCountMin !== undefined ? { playerCountMin: parsed.playerCountMin } : {}),
        ...(parsed.playerCountMax !== undefined ? { playerCountMax: parsed.playerCountMax } : {}),
        ...(parsed.active !== undefined ? { active: parsed.active } : {}),
      },
    });

    const dto = toSportDto(sport);
    await Promise.all([invalidateSportsCache(), invalidateMatchesCache()]);
    return ok(dto);
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
    await prisma.sport.update({
      where: { id },
      data: { active: false },
    });

    await invalidateSportsCache();
    return ok(null);
  } catch (error) {
    return handleRouteError(error);
  }
}
