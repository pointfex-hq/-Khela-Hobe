import { NextRequest, NextResponse } from 'next/server';
import { NotificationType, OrganizerApprovalStatus, UserRole } from '@prisma/client';
import prisma from '@/lib/prisma';
import { generateSafetyId } from '@/lib/auth';
import { invalidateUserCache } from '@/lib/cache';
import { recordAuditLog } from '@/lib/audit';
import {
  exchangeGoogleCode,
  fetchGoogleUserInfo,
  getGoogleOAuthConfig,
  isGoogleOAuthConfigured,
  signOAuthPayload,
  verifyOAuthPayload,
} from '@/lib/googleAuth';

interface GoogleOAuthState {
  mode: 'login' | 'link';
  userId?: string;
  role?: 'PLAYER' | 'ORGANIZER' | 'GUARDIAN';
  returnTo?: string;
  exp?: number;
}

export async function GET(request: NextRequest) {
  const cfg = getGoogleOAuthConfig();
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code') || '';
  const stateParam = searchParams.get('state') || '';
  const oauthError = searchParams.get('error') || '';

  const state = verifyOAuthPayload<GoogleOAuthState>(stateParam);
  const fallbackReturn = state?.mode === 'link' ? state.returnTo || '/player/profile/edit' : '/login';

  if (oauthError || !code || !state) {
    const errUrl = new URL(`${cfg.frontendUrl}${fallbackReturn}`);
    const message =
      oauthError === 'access_denied'
        ? 'Google sign-in was cancelled.'
        : 'Invalid or expired Google OAuth session.';
    errUrl.searchParams.set(state?.mode === 'link' ? 'googleError' : 'error', message);
    return NextResponse.redirect(errUrl, 303);
  }

  if (!isGoogleOAuthConfigured()) {
    const errUrl = new URL(`${cfg.frontendUrl}${fallbackReturn}`);
    errUrl.searchParams.set(
      state.mode === 'link' ? 'googleError' : 'error',
      'Google OAuth is not configured on the server.'
    );
    return NextResponse.redirect(errUrl, 303);
  }

  try {
    const tokenRes = await exchangeGoogleCode(code);
    const googleUser = await fetchGoogleUserInfo(tokenRes.access_token);

    if (!googleUser.sub || !googleUser.email) {
      throw new Error('Google profile did not include an email address.');
    }

    const googleEmail = googleUser.email.toLowerCase();

    // Flow A: Link Google account to an already authenticated user
    if (state.mode === 'link' && state.userId) {
      const existingOwner = await prisma.user.findUnique({
        where: { googleId: googleUser.sub },
        select: { id: true },
      });

      if (existingOwner && existingOwner.id !== state.userId) {
        const errUrl = new URL(`${cfg.frontendUrl}${state.returnTo || '/player/profile/edit'}`);
        errUrl.searchParams.set(
          'googleError',
          'This Google account is already linked to another Khela Hobe profile.'
        );
        return NextResponse.redirect(errUrl, 303);
      }

      const currentUser = await prisma.user.findUnique({
        where: { id: state.userId },
        select: { id: true, profileImageUrl: true },
      });

      if (!currentUser) {
        const errUrl = new URL(`${cfg.frontendUrl}/login`);
        errUrl.searchParams.set('error', 'User account not found.');
        return NextResponse.redirect(errUrl, 303);
      }

      await prisma.user.update({
        where: { id: state.userId },
        data: {
          googleId: googleUser.sub,
          googleEmail,
          googleLinkedAt: new Date(),
          emailVerified: true,
          ...(!currentUser.profileImageUrl && googleUser.picture
            ? { profileImageUrl: googleUser.picture }
            : {}),
        },
      });

      await recordAuditLog({
        userId: state.userId,
        action: 'GOOGLE_ACCOUNT_LINKED',
        entityType: 'USER',
        entityId: state.userId,
        notes: `Linked Gmail (${googleEmail}) and marked account emailVerified=true`,
        request,
      });

      const okUrl = new URL(`${cfg.frontendUrl}${state.returnTo || '/player/profile/edit'}`);
      await invalidateUserCache(state.userId);
      okUrl.searchParams.set('googleLinked', '1');
      return NextResponse.redirect(okUrl, 303);
    }

    // Flow B: Sign in / Sign up with Google
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ googleId: googleUser.sub }, { email: googleEmail }],
      },
    });

    if (user) {
      if (user.status !== 'ACTIVE') {
        const errUrl = new URL(`${cfg.frontendUrl}/login`);
        errUrl.searchParams.set('error', 'Your account is suspended or inactive.');
        return NextResponse.redirect(errUrl, 303);
      }

      if (!user.googleId || user.googleEmail !== googleEmail || !user.emailVerified) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: googleUser.sub,
            googleEmail,
            googleLinkedAt: user.googleLinkedAt ?? new Date(),
            emailVerified: true,
            ...(!user.profileImageUrl && googleUser.picture
              ? { profileImageUrl: googleUser.picture }
              : {}),
          },
        });
      }
    } else {
      const displayName = (googleUser.name || googleEmail.split('@')[0] || 'Player').slice(0, 120);
      const assignedRole: UserRole =
        state.role === 'ORGANIZER' ? UserRole.ORGANIZER : UserRole.PLAYER;
      const rolesToCreate: UserRole[] =
        assignedRole === UserRole.ORGANIZER
          ? [UserRole.ORGANIZER, UserRole.PLAYER]
          : [UserRole.PLAYER];
      const approvalStatus =
        assignedRole === UserRole.ORGANIZER
          ? OrganizerApprovalStatus.PENDING
          : OrganizerApprovalStatus.NONE;

      user = await prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            fullName: displayName,
            email: googleEmail,
            passwordHash: null,
            googleId: googleUser.sub,
            googleEmail,
            googleLinkedAt: new Date(),
            profileImageUrl: googleUser.picture || null,
            emailVerified: true,
            organizerApprovalStatus: approvalStatus,
            status: 'ACTIVE',
            primarySkillLevel: 'INTERMEDIATE',
            roles: {
              create: rolesToCreate.map((role) => ({ role })),
            },
          },
        });

        const playerProfile = await tx.playerProfile.create({
          data: {
            userId: created.id,
            displayName,
            city: 'Dhaka',
            skillLevel: 'INTERMEDIATE',
          },
        });

        let safetyId = generateSafetyId(displayName);
        for (let i = 0; i < 5; i += 1) {
          const collision = await tx.safetyProfile.findUnique({ where: { safetyId } });
          if (!collision) break;
          safetyId = generateSafetyId(displayName);
        }

        await tx.safetyProfile.create({
          data: {
            playerProfileId: playerProfile.id,
            safetyId,
          },
        });

        return created;
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
              message: `${displayName} (${googleEmail}) registered via Google as an Organizer and requires admin approval.`,
              link: '/admin/users?tab=approvals',
            })),
          });
        }
        await recordAuditLog({
          userId: user.id,
          action: 'ORGANIZER_APPROVAL_REQUESTED',
          entityType: 'USER',
          entityId: user.id,
          notes: `Google OAuth signup requested Organizer role (${googleEmail})`,
          request,
        });
      }
    }

    const exchangeToken = signOAuthPayload(
      {
        purpose: 'google_login_exchange',
        userId: user.id,
      },
      120
    );

    const successUrl = new URL(`${cfg.frontendUrl}/auth/google/callback`);
    successUrl.searchParams.set('code', exchangeToken);
    return NextResponse.redirect(successUrl, 303);
  } catch (err) {
    console.error('[Google OAuth Callback Error]', err);
    const errUrl = new URL(`${cfg.frontendUrl}${fallbackReturn}`);
    errUrl.searchParams.set(
      state?.mode === 'link' ? 'googleError' : 'error',
      'Unable to complete Google authentication. Please try again.'
    );
    return NextResponse.redirect(errUrl, 303);
  }
}
