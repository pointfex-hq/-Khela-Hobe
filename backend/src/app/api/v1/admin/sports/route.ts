import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { toSportDto } from '@/lib/mappers';
import { invalidateSportsCache } from '@/lib/cache';

const createSportSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().min(2).max(100).optional(),
  iconUrl: z.string().trim().max(1000).optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
  playerCountMin: z.number().int().min(1).max(100).optional(),
  playerCountMax: z.number().int().min(1).max(100).optional(),
});

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
    const parsed = createSportSchema.parse(body);

    const slug =
      parsed.slug?.toLowerCase() ||
      parsed.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const sport = await prisma.sport.create({
      data: {
        name: parsed.name,
        slug,
        iconUrl: parsed.iconUrl ?? '⚽',
        description: parsed.description ?? null,
        playerCountMin: parsed.playerCountMin ?? 2,
        playerCountMax: parsed.playerCountMax ?? 14,
        active: true,
      },
    });

    const dto = toSportDto(sport);
    await invalidateSportsCache();
    return ok(dto, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
