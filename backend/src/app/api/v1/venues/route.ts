import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok, parsePagination, toPageResponse } from '@/lib/http';
import { verifySession, isOrganizerVerifiedForCreation } from '@/lib/auth';
import { toVenueDto } from '@/lib/mappers';

const createVenueSchema = z.object({
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().max(1000).optional(),
  address: z.string().trim().min(2).max(255),
  city: z.string().trim().min(2).max(100),
  area: z.string().trim().max(100).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  isTurf: z.boolean().optional(),
  coverImageUrl: z.string().url().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const { page, size, skip, searchParams } = parsePagination(request.url, 20);
    const city = searchParams.get('city')?.trim();
    const q = searchParams.get('q')?.trim();

    const where = {
      active: true,
      ...(city ? { city: { contains: city, mode: 'insensitive' as const } } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' as const } },
              { area: { contains: q, mode: 'insensitive' as const } },
              { address: { contains: q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [venues, total] = await Promise.all([
      prisma.venue.findMany({
        where,
        skip,
        take: size,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.venue.count({ where }),
    ]);

    return ok(
      toPageResponse(
        venues.map((v) => ({
          ...toVenueDto(v),
          description: v.description,
          isTurf: v.isTurf,
          coverImageUrl: v.coverImageUrl,
        })),
        page,
        size,
        total
      )
    );
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

    const approvalCheck = await isOrganizerVerifiedForCreation(session.userId, session.roles);
    if (!approvalCheck.allowed) {
      return fail('ACCESS_DENIED', approvalCheck.message || 'Organizer verification required', 403);
    }

    const body = await request.json();
    const parsed = createVenueSchema.parse(body);

    const venue = await prisma.venue.create({
      data: {
        ownerId: session.userId,
        name: parsed.name,
        description: parsed.description ?? null,
        address: parsed.address,
        city: parsed.city,
        area: parsed.area ?? null,
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        isTurf: parsed.isTurf ?? false,
        coverImageUrl: parsed.coverImageUrl ?? null,
        active: true,
      },
    });

    return ok(
      {
        ...toVenueDto(venue),
        description: venue.description,
        isTurf: venue.isTurf,
        coverImageUrl: venue.coverImageUrl,
      },
      201
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
