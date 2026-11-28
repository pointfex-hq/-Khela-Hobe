import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { handleRouteError, ok } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { toMatchDto } from '@/lib/mappers';
import { buildMatchEligibilityWhere, getViewerEligibilityProfile } from '@/lib/eligibility';

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession(request);
    const viewer = await getViewerEligibilityProfile(session);
    const eligibilityWhere = buildMatchEligibilityWhere(viewer);
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '23.8103');
    const lng = parseFloat(searchParams.get('lng') || '90.4125');
    const radiusKm = Math.max(1, Math.min(500, parseFloat(searchParams.get('radiusKm') || '25') || 25));
    const sportId = searchParams.get('sportId')?.trim();

    const where: Prisma.MatchWhereInput = {
      status: { in: ['OPEN', 'FULL', 'IN_PROGRESS'] },
      ...(sportId ? { sportId } : {}),
      ...(eligibilityWhere ? { AND: [eligibilityWhere] } : {}),
    };

    const matches = await prisma.match.findMany({
      where,
      orderBy: { startTime: 'asc' },
      take: 100,
      include: {
        sport: true,
        organizer: { select: { id: true, fullName: true, profileImageUrl: true } },
        venue: true,
        participants: { select: { status: true } },
        equipmentRequirements: {
          orderBy: { createdAt: 'asc' },
          include: {
            contributions: {
              include: { user: { select: { id: true, fullName: true, profileImageUrl: true } } },
            },
          },
        },
      },
    });

    const filtered = matches
      .map((m) => ({
        match: m,
        distanceKm: haversineKm(lat, lng, m.latitude, m.longitude),
      }))
      .filter((entry) => Number.isNaN(lat) || Number.isNaN(lng) || entry.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .map((entry) => ({
        ...toMatchDto(entry.match),
        distanceKm: Number(entry.distanceKm.toFixed(2)),
      }));

    return ok(filtered);
  } catch (error) {
    return handleRouteError(error);
  }
}
