import { createHmac, randomInt, timingSafeEqual } from 'crypto';
import { OtpPurpose } from '@prisma/client';
import prisma from '@/lib/prisma';

const OTP_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production-123456789';

export function hashOtpCode(email: string, code: string, purpose: OtpPurpose): string {
  return createHmac('sha256', OTP_SECRET)
    .update(`${purpose}:${email.toLowerCase().trim()}:${code.trim()}`)
    .digest('hex');
}

export async function issueOtpCode({
  userId,
  email,
  purpose,
  ttlMinutes = 15,
}: {
  userId?: string | null;
  email: string;
  purpose: OtpPurpose;
  ttlMinutes?: number;
}): Promise<{ code: string; expiresAt: Date }> {
  const normalizedEmail = email.toLowerCase().trim();
  const code = String(randomInt(100000, 1000000));
  const codeHash = hashOtpCode(normalizedEmail, code, purpose);
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  await prisma.verificationOtp.updateMany({
    where: {
      email: normalizedEmail,
      purpose,
      consumedAt: null,
    },
    data: { consumedAt: new Date() },
  });

  await prisma.verificationOtp.create({
    data: {
      userId: userId || null,
      email: normalizedEmail,
      codeHash,
      purpose,
      expiresAt,
    },
  });

  return { code, expiresAt };
}

export async function verifyAndConsumeOtp({
  email,
  code,
  purpose,
}: {
  email?: string;
  code: string;
  purpose: OtpPurpose;
}): Promise<{ valid: boolean; userId: string | null; email: string | null; error?: string }> {
  const cleanCode = code.trim();
  if (!cleanCode || cleanCode.length < 6) {
    return { valid: false, userId: null, email: null, error: 'Invalid verification code format.' };
  }

  const normalizedEmail = email ? email.toLowerCase().trim() : undefined;

  const candidates = await prisma.verificationOtp.findMany({
    where: {
      ...(normalizedEmail ? { email: normalizedEmail } : {}),
      purpose,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  if (candidates.length === 0) {
    return {
      valid: false,
      userId: null,
      email: null,
      error: 'Verification code is invalid or has expired. Please request a new code.',
    };
  }

  for (const row of candidates) {
    if (row.attempts >= 5) continue;
    const expectedHash = hashOtpCode(row.email, cleanCode, purpose);
    const a = Buffer.from(row.codeHash, 'utf8');
    const b = Buffer.from(expectedHash, 'utf8');
    if (a.length === b.length && timingSafeEqual(a, b)) {
      await prisma.verificationOtp.update({
        where: { id: row.id },
        data: { consumedAt: new Date() },
      });
      return { valid: true, userId: row.userId, email: row.email };
    }
  }

  // Increment attempt count on the most recent active OTP for rate safety
  const latest = candidates[0];
  await prisma.verificationOtp.update({
    where: { id: latest.id },
    data: { attempts: { increment: 1 } },
  });

  return {
    valid: false,
    userId: null,
    email: null,
    error: 'Incorrect verification code. Please check your inbox and try again.',
  };
}
