import prisma from '@/lib/prisma';
import { handleRouteError, ok } from '@/lib/http';
import { toSportDto } from '@/lib/mappers';
import { CACHE_KEYS, cacheGet, cacheSet } from '@/lib/cache';

const DEFAULT_SPORTS_CATALOG = [
  {
    name: 'Football & Futsal',
    slug: 'football-futsal',
    iconUrl: '⚽',
    description: '5v5, 7v7, and 11v11 turf & grass football games.',
    playerCountMin: 10,
    playerCountMax: 22,
    active: true,
  },
  {
    name: 'Badminton',
    slug: 'badminton',
    iconUrl: '🏸',
    description: 'Singles and doubles indoor & outdoor court sessions.',
    playerCountMin: 2,
    playerCountMax: 4,
    active: true,
  },
  {
    name: 'Cricket',
    slug: 'cricket',
    iconUrl: '🏏',
    description: 'Tape ball, box cricket, and turf T10/T20 matches.',
    playerCountMin: 12,
    playerCountMax: 22,
    active: true,
  },
  {
    name: 'Basketball',
    slug: 'basketball',
    iconUrl: '🏀',
    description: 'Half-court 3v3 and full-court 5v5 pickup runs.',
    playerCountMin: 6,
    playerCountMax: 10,
    active: true,
  },
];

export async function GET() {
  try {
    const cached = await cacheGet<ReturnType<typeof toSportDto>[]>(CACHE_KEYS.SPORTS_ACTIVE);
    if (cached) {
      return ok(cached);
    }

    const count = await prisma.sport.count();
    if (count === 0) {
      await prisma.sport.createMany({
        data: DEFAULT_SPORTS_CATALOG,
        skipDuplicates: true,
      });
    }

    const sports = await prisma.sport.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });

    const dtoList = sports.map(toSportDto);
    await cacheSet(CACHE_KEYS.SPORTS_ACTIVE, dtoList, 300);
    return ok(dtoList);
  } catch (error) {
    return handleRouteError(error);
  }
}
