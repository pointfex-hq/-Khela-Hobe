import { NextRequest } from 'next/server';
import { z } from 'zod';
import { OtpPurpose } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { issueOtpCode } from '@/lib/otp';
import { sendEmail } from '@/lib/mailer';
import { otpVerificationEmailTemplate } from '@/lib/emailTemplates';

const resendSchema = z.object({
  email: z.string().trim().email().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession(request);
    const body = await request.json().catch(() => ({}));
    const parsed = resendSchema.parse(body);

    const user = session
      ? await prisma.user.findUnique({ where: { id: session.userId } })
      : parsed.email
        ? await prisma.user.findUnique({ where: { email: parsed.email.toLowerCase() } })
        : null;

    if (!user) {
      return fail('RESOURCE_NOT_FOUND', 'Account not found for OTP delivery', 404);
    }

    if (user.emailVerified) {
      return ok({ sent: false, alreadyVerified: true, message: 'Your email is already verified.' });
    }

    const { code } = await issueOtpCode({
      userId: user.id,
      email: user.email,
      purpose: OtpPurpose.EMAIL_VERIFY,
      ttlMinutes: 15,
    });

    const tpl = otpVerificationEmailTemplate({
      name: user.fullName,
      code,
      expiresMinutes: 15,
    });

    const mailRes = await sendEmail({
      to: user.email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
    });

    return ok({
      sent: true,
      provider: mailRes.provider,
      message: mailRes.delivered
        ? `A 6-digit verification code was sent to ${user.email}.`
        : `Verification OTP generated for ${user.email}. Configure RESEND_API_KEY or Gmail SMTP to send live emails.`,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
