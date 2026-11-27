import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { handleRouteError, ok } from '@/lib/http';
import { toVenueDto, toZoneDto } from '@/lib/mappers';
import { CACHE_KEYS, cacheGet, cacheSet } from '@/lib/cache';

const DEFAULT_BANGLADESH_ZONES = [
  // Dhaka Metro & Suburbs
  { division: 'Dhaka', city: 'Dhaka', area: 'Dhanmondi', latitude: 23.7465, longitude: 90.376, zoom: 14 },
  { division: 'Dhaka', city: 'Dhaka', area: 'Banani', latitude: 23.7937, longitude: 90.4066, zoom: 14 },
  { division: 'Dhaka', city: 'Dhaka', area: 'Gulshan', latitude: 23.7925, longitude: 90.4078, zoom: 14 },
  { division: 'Dhaka', city: 'Dhaka', area: 'Uttara', latitude: 23.8759, longitude: 90.3795, zoom: 13 },
  { division: 'Dhaka', city: 'Dhaka', area: 'Mirpur', latitude: 23.8223, longitude: 90.3654, zoom: 13 },
  { division: 'Dhaka', city: 'Dhaka', area: 'Mohammadpur', latitude: 23.7662, longitude: 90.3589, zoom: 14 },
  { division: 'Dhaka', city: 'Dhaka', area: 'Bashundhara R/A', latitude: 23.8191, longitude: 90.4526, zoom: 14 },
  { division: 'Dhaka', city: 'Dhaka', area: 'Motijheel', latitude: 23.733, longitude: 90.4172, zoom: 14 },
  { division: 'Dhaka', city: 'Dhaka', area: 'Badda', latitude: 23.7805, longitude: 90.4267, zoom: 14 },
  { division: 'Dhaka', city: 'Gazipur', area: 'Gazipur Sadar', latitude: 23.9999, longitude: 90.4203, zoom: 13 },
  { division: 'Dhaka', city: 'Narayanganj', area: 'Chashara', latitude: 23.6238, longitude: 90.499, zoom: 14 },
  // Chattogram
  { division: 'Chattogram', city: 'Chattogram', area: 'GEC Circle', latitude: 22.3591, longitude: 91.8215, zoom: 14 },
  { division: 'Chattogram', city: 'Chattogram', area: 'Agrabad', latitude: 22.3235, longitude: 91.8124, zoom: 14 },
  { division: 'Chattogram', city: 'Chattogram', area: 'Halishahar', latitude: 22.3408, longitude: 91.7825, zoom: 14 },
  { division: 'Chattogram', city: 'Cox\'s Bazar', area: 'Kolatoli', latitude: 21.4167, longitude: 91.9833, zoom: 13 },
  // Sylhet
  { division: 'Sylhet', city: 'Sylhet', area: 'Zindabazar', latitude: 24.8949, longitude: 91.8687, zoom: 14 },
  { division: 'Sylhet', city: 'Sylhet', area: 'Shahjalal Upashahar', latitude: 24.8868, longitude: 91.8884, zoom: 14 },
  // Rajshahi
  { division: 'Rajshahi', city: 'Rajshahi', area: 'Shaheb Bazar', latitude: 24.3636, longitude: 88.6241, zoom: 14 },
  { division: 'Rajshahi', city: 'Bogura', area: 'Satmatha', latitude: 24.8481, longitude: 89.373, zoom: 14 },
  // Khulna
  { division: 'Khulna', city: 'Khulna', area: 'Sonadanga', latitude: 22.8159, longitude: 89.5469, zoom: 14 },
  // Barishal
  { division: 'Barishal', city: 'Barishal', area: 'Sadar Road', latitude: 22.701, longitude: 90.3535, zoom: 14 },
  // Rangpur
  { division: 'Rangpur', city: 'Rangpur', area: 'Jahaj Company More', latitude: 25.7439, longitude: 89.2752, zoom: 14 },
  // Mymensingh
  { division: 'Mymensingh', city: 'Mymensingh', area: 'Ganginarpar', latitude: 24.7471, longitude: 90.4203, zoom: 14 },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const division = searchParams.get('division')?.trim();
    const city = searchParams.get('city')?.trim();

    if (!division && !city) {
      const cached = await cacheGet<{ zones: unknown[]; venues: unknown[] }>(
        CACHE_KEYS.LOCATIONS_ALL
      );
      if (cached) {
        return ok(cached);
      }
    }

    const existingCount = await prisma.zone.count();
    if (existingCount === 0) {
      await prisma.zone.createMany({
        data: DEFAULT_BANGLADESH_ZONES.map((z) => ({ ...z, name: z.area, active: true })),
        skipDuplicates: true,
      });
    }

    const zoneWhere: Record<string, unknown> = { active: true };
    const venueWhere: Record<string, unknown> = { active: true };
    if (division) {
      zoneWhere.division = { equals: division, mode: 'insensitive' };
    }
    if (city) {
      zoneWhere.city = { equals: city, mode: 'insensitive' };
      venueWhere.city = { equals: city, mode: 'insensitive' };
    }

    const [zones, venues] = await Promise.all([
      prisma.zone.findMany({
        where: zoneWhere,
        orderBy: [{ division: 'asc' }, { city: 'asc' }, { area: 'asc' }],
      }),
      prisma.venue.findMany({
        where: venueWhere,
        orderBy: [{ city: 'asc' }, { name: 'asc' }],
      }),
    ]);

    const payload = {
      zones: zones.map(toZoneDto),
      venues: venues.map(toVenueDto),
    };

    if (!division && !city) {
      await cacheSet(CACHE_KEYS.LOCATIONS_ALL, payload, 300);
    }

    return ok(payload);
  } catch (error) {
    return handleRouteError(error);
  }
}
