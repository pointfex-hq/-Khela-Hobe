import { NextRequest } from 'next/server';
import { z } from 'zod';
import { OtpPurpose } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import { issueOtpCode } from '@/lib/otp';
import { sendEmail } from '@/lib/mailer';
import { passwordResetEmailTemplate } from '@/lib/emailTemplates';
import { recordAuditLog } from '@/lib/audit';

const forgotSchema = z.object({
  identifier: z.string().trim().min(3, 'Email or phone number is required').max(150),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = forgotSchema.parse(body);
    const raw = parsed.identifier.trim();
    const normalizedEmail = raw.toLowerCase();
    const compactPhone = raw.replace(/[\s-]/g, '');

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { phoneNumber: raw },
          { phoneNumber: compactPhone },
        ],
      },
      select: { id: true, fullName: true, email: true, status: true },
    });

    if (!user) {
      return fail(
        'RESOURCE_NOT_FOUND',
        'No registered Khela Hobe account found for that email or phone number.',
        404
      );
    }

    if (user.status !== 'ACTIVE') {
      return fail('ACCESS_DENIED', 'This account is suspended or inactive.', 403);
    }

    const { code } = await issueOtpCode({
      userId: user.id,
      email: user.email,
      purpose: OtpPurpose.PASSWORD_RESET,
      ttlMinutes: 15,
    });

    const tpl = passwordResetEmailTemplate({
      name: user.fullName,
      code,
      expiresMinutes: 15,
    });

    const delivery = await sendEmail({
      to: user.email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
    });

    await recordAuditLog({
      userId: user.id,
      action: 'PASSWORD_RESET_REQUESTED',
      entityType: 'USER',
      entityId: user.id,
      notes: `Password reset OTP dispatched (${delivery.provider})`,
      request,
    });

    return ok({
      sent: true,
      provider: delivery.provider,
      message: delivery.delivered
        ? `A 6-digit password reset code was sent to ${user.email}.`
        : `Password reset OTP issued for ${user.email}. Configure RESEND_API_KEY or Gmail SMTP for live delivery.`,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
