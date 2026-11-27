import { NextRequest } from 'next/server';
import { z } from 'zod';
import { NotificationType, OrganizerApprovalStatus, OtpPurpose, UserRole } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
  generateSafetyId,
  hashPassword,
  signAccessToken,
  signRefreshToken,
  toUserDto,
} from '@/lib/auth';
import { issueOtpCode } from '@/lib/otp';
import { sendEmail } from '@/lib/mailer';
import { otpVerificationEmailTemplate } from '@/lib/emailTemplates';
import { recordAuditLog } from '@/lib/audit';

const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(120),
  email: z.string().trim().email('Valid email is required'),
  phoneNumber: z.string().trim().max(30).optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  role: z.enum(['PLAYER', 'ORGANIZER']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.parse(body);

    const email = parsed.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return fail('CONFLICT', 'Email is already registered', 409, [
        { field: 'email', message: 'Email is already registered' },
      ]);
    }

    const passwordHash = await hashPassword(parsed.password);
    const assignedRole: UserRole =
      parsed.role === 'ORGANIZER' ? UserRole.ORGANIZER : UserRole.PLAYER;
    const rolesToCreate: UserRole[] =
      assignedRole === UserRole.ORGANIZER
        ? [UserRole.ORGANIZER, UserRole.PLAYER]
        : [UserRole.PLAYER];
    const approvalStatus =
      assignedRole === UserRole.ORGANIZER
        ? OrganizerApprovalStatus.PENDING
        : OrganizerApprovalStatus.NONE;

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          fullName: parsed.fullName,
          email,
          phoneNumber: parsed.phoneNumber || null,
          passwordHash,
          status: 'ACTIVE',
          emailVerified: false,
          organizerApprovalStatus: approvalStatus,
          primarySkillLevel: 'INTERMEDIATE',
          roles: {
            create: rolesToCreate.map((role) => ({ role })),
          },
        },
        include: {
          roles: true,
        },
      });

      const playerProfile = await tx.playerProfile.create({
        data: {
          userId: created.id,
          displayName: parsed.fullName,
          city: 'Dhaka',
          skillLevel: 'INTERMEDIATE',
        },
      });

      let safetyId = generateSafetyId(parsed.fullName);
      for (let i = 0; i < 5; i += 1) {
        const collision = await tx.safetyProfile.findUnique({ where: { safetyId } });
        if (!collision) break;
        safetyId = generateSafetyId(parsed.fullName);
      }

      const safetyProfile = await tx.safetyProfile.create({
        data: {
          playerProfileId: playerProfile.id,
          safetyId,
        },
      });

      return {
        ...created,
        playerProfile: {
          ...playerProfile,
          safetyProfile,
        },
      };
    });

    if (assignedRole === UserRole.ORGANIZER) {
      const admins = await prisma.userRoleAssignment.findMany({
        where: { role: 'ADMIN' },
        select: { userId: true },
      });
      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map((a) => ({
            userId: a.userId,
            type: NotificationType.GENERAL,
            title: 'New Organizer Verification Request',
            message: `${user.fullName} (${user.email}) registered as an Organizer and requires admin approval before creating matches or tournaments.`,
            link: '/admin/users?tab=approvals',
          })),
        });
      }
      await recordAuditLog({
        userId: user.id,
        action: 'ORGANIZER_APPROVAL_REQUESTED',
        entityType: 'USER',
        entityId: user.id,
        notes: `${user.fullName} (${user.email}) requested Organizer verification on registration`,
        request,
      });
    }

    // Send verification OTP email
    const { code } = await issueOtpCode({
      userId: user.id,
      email: user.email,
      purpose: OtpPurpose.EMAIL_VERIFY,
      ttlMinutes: 15,
    });
    const otpTpl = otpVerificationEmailTemplate({
      name: user.fullName,
      code,
      expiresMinutes: 15,
    });
    sendEmail({
      to: user.email,
      subject: otpTpl.subject,
      html: otpTpl.html,
      text: otpTpl.text,
    }).catch(() => {});

    await recordAuditLog({
      userId: user.id,
      action: 'USER_REGISTERED',
      entityType: 'USER',
      entityId: user.id,
      notes: `Registered as ${assignedRole}`,
      request,
    });

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

    const response = ok(
      {
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
        expiresIn: ACCESS_TOKEN_TTL_SECONDS,
        emailVerificationRequired: true,
        user: toUserDto(user),
      },
      201
    );

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
