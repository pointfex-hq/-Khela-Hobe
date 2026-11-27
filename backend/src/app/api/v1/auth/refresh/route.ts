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
  verifyJwt,
} from '@/lib/auth';

const refreshSchema = z.object({
  refreshToken: z.string().min(10, 'Refresh token is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = refreshSchema.parse(body);

    const decoded = verifyJwt(parsed.refreshToken);
    if (!decoded || decoded.type !== 'refresh') {
      return fail('UNAUTHORIZED', 'Invalid or expired refresh token', 401);
    }

    const existingSession = await prisma.session.findUnique({
      where: { token: parsed.refreshToken },
      include: {
        user: {
          include: {
            roles: true,
            playerProfile: {
              include: { safetyProfile: true },
            },
          },
        },
      },
    });

    if (
      !existingSession ||
      !existingSession.active ||
      existingSession.expiresAt < new Date() ||
      existingSession.user.status !== 'ACTIVE'
    ) {
      return fail('UNAUTHORIZED', 'Refresh session expired or revoked', 401);
    }

    const user = existingSession.user;
    const roleNames = user.roles.map((r) => r.role);
    const newAccessToken = signAccessToken(user.id, roleNames);
    const newRefreshToken = signRefreshToken(user.id);

    await prisma.$transaction([
      prisma.session.update({
        where: { id: existingSession.id },
        data: { active: false },
      }),
      prisma.session.create({
        data: {
          userId: user.id,
          token: newRefreshToken,
          ipAddress: request.headers.get('x-forwarded-for') || null,
          userAgent: request.headers.get('user-agent') || null,
          expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
          active: true,
        },
      }),
    ]);

    const response = ok({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      tokenType: 'Bearer',
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      user: toUserDto(user),
    });

    response.cookies.set('session_token', newRefreshToken, {
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
