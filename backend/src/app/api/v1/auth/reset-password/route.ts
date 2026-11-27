import { NextRequest } from 'next/server';
import { z } from 'zod';
import { OtpPurpose } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import { hashPassword, invalidateUserSessions } from '@/lib/auth';
import { verifyAndConsumeOtp } from '@/lib/otp';
import { invalidateUserCache } from '@/lib/cache';
import { recordAuditLog } from '@/lib/audit';

const resetSchema = z.object({
  code: z.string().trim().min(6, '6-digit verification code is required').max(12),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  identifier: z.string().trim().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = resetSchema.parse(body);

    let targetEmail: string | undefined;
    if (parsed.identifier) {
      const matched = await prisma.user.findFirst({
        where: {
          OR: [
            { email: parsed.identifier.toLowerCase() },
            { phoneNumber: parsed.identifier },
          ],
        },
        select: { email: true },
      });
      targetEmail = matched?.email;
    }

    const verified = await verifyAndConsumeOtp({
      email: targetEmail,
      code: parsed.code,
      purpose: OtpPurpose.PASSWORD_RESET,
    });

    if (!verified.valid) {
      return fail('BAD_REQUEST', verified.error || 'Invalid or expired reset code', 400);
    }

    const user = await prisma.user.findFirst({
      where: verified.userId ? { id: verified.userId } : { email: verified.email || undefined },
      select: { id: true, email: true },
    });

    if (!user) {
      return fail('RESOURCE_NOT_FOUND', 'User account not found', 404);
    }

    const newHash = await hashPassword(parsed.password);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        emailVerified: true,
      },
    });

    await invalidateUserSessions(user.id);
    await invalidateUserCache(user.id);

    await recordAuditLog({
      userId: user.id,
      action: 'PASSWORD_RESET_COMPLETED',
      entityType: 'USER',
      entityId: user.id,
      notes: 'Password updated and email marked verified via OTP recovery',
      request,
    });

    return ok({
      reset: true,
      message: 'Your password has been updated. You can now sign in with your new password.',
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
