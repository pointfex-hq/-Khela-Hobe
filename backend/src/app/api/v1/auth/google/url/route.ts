import { NextRequest } from 'next/server';
import { fail, handleRouteError, ok } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import {
  buildGoogleAuthUrl,
  isGoogleOAuthConfigured,
  signOAuthPayload,
} from '@/lib/googleAuth';

export async function GET(request: NextRequest) {
  try {
    if (!isGoogleOAuthConfigured()) {
      return fail(
        'GOOGLE_OAUTH_NOT_CONFIGURED',
        'Google OAuth is not configured on the server yet. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env.',
        503
      );
    }

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') === 'link' ? 'link' : 'login';
    const rawRole = (searchParams.get('role') || 'PLAYER').toUpperCase();
    const role = rawRole === 'ORGANIZER' ? 'ORGANIZER' : 'PLAYER';
    const returnToParam = searchParams.get('returnTo') || '';
    const returnTo =
      returnToParam.startsWith('/') && !returnToParam.startsWith('//')
        ? returnToParam
        : mode === 'link'
          ? '/player/profile/edit'
          : '/login';

    let userId: string | undefined;
    if (mode === 'link') {
      const session = await verifySession(request);
      if (!session) {
        return fail('UNAUTHORIZED', 'Please sign in before linking a Google account', 401);
      }
      userId = session.userId;
    }

    const state = signOAuthPayload(
      {
        mode,
        userId,
        role,
        returnTo,
      },
      300
    );

    const url = buildGoogleAuthUrl(state);
    return ok({ url });
  } catch (error) {
    return handleRouteError(error);
  }
}
