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
  verifyPassword,
} from '@/lib/auth';

const loginSchema = z.object({
  email: z.string().trim().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.parse(body);

    const email = parsed.email.toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        roles: true,
        playerProfile: {
          include: {
            safetyProfile: true,
          },
        },
      },
    });

    if (!user) {
      return fail('UNAUTHORIZED', 'Invalid email or password', 401);
    }

    if (user.status !== 'ACTIVE') {
      return fail('ACCESS_DENIED', 'Your account is suspended or inactive', 403);
    }

    if (!user.passwordHash) {
      return fail(
        'UNAUTHORIZED',
        'This account uses Google Sign-In. Click "Continue with Google" or reset your password.',
        401
      );
    }

    const valid = await verifyPassword(parsed.password, user.passwordHash);
    if (!valid) {
      return fail('UNAUTHORIZED', 'Invalid email or password', 401);
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
