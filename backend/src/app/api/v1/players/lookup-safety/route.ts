import { NextRequest } from 'next/server';
import { fail, handleRouteError, ok } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { resolveSafetyId } from '@/lib/tickets';

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { searchParams } = new URL(request.url);
    const safetyId = searchParams.get('safetyId')?.trim();
    if (!safetyId) {
      return fail('VALIDATION_ERROR', 'safetyId query parameter is required', 400);
    }

    const player = await resolveSafetyId(safetyId);
    if (!player) {
      return fail('RESOURCE_NOT_FOUND', `No player found with Safety ID "${safetyId}"`, 404);
    }

    return ok({
      id: player.id,
      fullName: player.fullName,
      safetyId: player.safetyId,
      profileImageUrl: player.profileImageUrl,
      city: player.city,
      area: player.area,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
