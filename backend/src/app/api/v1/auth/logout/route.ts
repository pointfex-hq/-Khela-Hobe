import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { ok } from '@/lib/http';
import { invalidateUserSessions, verifySession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession(request);
    if (session) {
      await invalidateUserSessions(session.userId);
    } else {
      const cookieToken = request.cookies.get('session_token')?.value;
      if (cookieToken) {
        await prisma.session.updateMany({
          where: { token: cookieToken },
          data: { active: false },
        });
      }
    }
  } catch {
    // Always succeed on logout
  }

  const response = ok(null);
  response.cookies.set('session_token', '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
