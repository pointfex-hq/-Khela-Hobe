import { NextRequest } from 'next/server';
import { fail, handleRouteError, ok } from '@/lib/http';
import { getEnrichedUserProfile, verifySession } from '@/lib/auth';
import { CACHE_KEYS, cacheGet, cacheSet } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const cacheKey = CACHE_KEYS.USER_ME(session.userId);
    const cached = await cacheGet<Awaited<ReturnType<typeof getEnrichedUserProfile>>>(cacheKey);
    if (cached) {
      return ok(cached);
    }

    const dto = await getEnrichedUserProfile(session.userId);
    if (!dto || !dto.active) {
      return fail('UNAUTHORIZED', 'User not found or inactive', 401);
    }

    await cacheSet(cacheKey, dto, 180);
    return ok(dto);
  } catch (error) {
    return handleRouteError(error);
  }
}
