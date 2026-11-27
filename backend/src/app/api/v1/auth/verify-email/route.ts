import { NextRequest } from 'next/server';
import { z } from 'zod';
import { OtpPurpose } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import { getEnrichedUserProfile, verifySession } from '@/lib/auth';
import { verifyAndConsumeOtp } from '@/lib/otp';
import { invalidateUserCache } from '@/lib/cache';
import { recordAuditLog } from '@/lib/audit';

const verifyEmailSchema = z.object({
  code: z.string().trim().min(6, '6-digit verification code is required').max(12),
  email: z.string().trim().email().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession(request);
    const body = await request.json();
    const parsed = verifyEmailSchema.parse(body);

    let targetEmail = parsed.email?.toLowerCase();
    if (!targetEmail && session) {
      const currentUser = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { email: true },
      });
      targetEmail = currentUser?.email;
    }

    if (!targetEmail) {
      return fail('VALIDATION_ERROR', 'Email address or active session is required', 400);
    }

    const result = await verifyAndConsumeOtp({
      email: targetEmail,
      code: parsed.code,
      purpose: OtpPurpose.EMAIL_VERIFY,
    });

    if (!result.valid) {
      return fail('BAD_REQUEST', result.error || 'Invalid or expired OTP', 400);
    }

    const user = await prisma.user.findFirst({
      where: result.userId ? { id: result.userId } : { email: targetEmail },
      select: { id: true },
    });

    if (!user) {
      return fail('RESOURCE_NOT_FOUND', 'User account not found', 404);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });

    await invalidateUserCache(user.id);
    await recordAuditLog({
      userId: user.id,
      action: 'EMAIL_VERIFIED',
      entityType: 'USER',
      entityId: user.id,
      notes: `Verified email address ${targetEmail} via OTP`,
      request,
    });

    const profile = await getEnrichedUserProfile(user.id);
    return ok({ verified: true, user: profile });
  } catch (error) {
    return handleRouteError(error);
  }
}
