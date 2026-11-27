import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
  signAccessToken,
  signRefreshToken,
  toUserDto,
} from '@/lib/auth';
import { verifyOAuthPayload } from '@/lib/googleAuth';

const exchangeSchema = z.object({
  code: z.string().min(10, 'Exchange code is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = exchangeSchema.parse(body);

    const payload = verifyOAuthPayload<{
      purpose?: string;
      userId?: string;
      exp?: number;
    }>(parsed.code);

    if (!payload || payload.purpose !== 'google_login_exchange' || !payload.userId) {
      return fail('UNAUTHORIZED', 'Invalid or expired Google login code', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        roles: true,
        playerProfile: {
          include: { safetyProfile: true },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      return fail('UNAUTHORIZED', 'User account is unavailable or inactive', 401);
    }

    const roleNames = user.roles.map((r) => r.role);
    const accessToken = signAccessToken(user.id, roleNames);
    const refreshToken = signRefreshToken(user.id);

    await prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        ipAddress: request.headers.get('x-forwarded-for') || null,
        userAgent: request.headers.get('user-agent') || null,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
        active: true,
      },
    });

    const response = ok({
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      user: toUserDto(user),
    });

    response.cookies.set('session_token', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: REFRESH_TOKEN_TTL_SECONDS,
    });

    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}
