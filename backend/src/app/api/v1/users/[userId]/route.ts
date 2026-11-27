import { NextRequest } from 'next/server';
import { fail, handleRouteError, ok } from '@/lib/http';
import { getEnrichedUserProfile } from '@/lib/auth';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const dto = await getEnrichedUserProfile(userId);

    if (!dto) {
      return fail('RESOURCE_NOT_FOUND', 'User not found', 404);
    }

    return ok(dto);
  } catch (error) {
    return handleRouteError(error);
  }
}
