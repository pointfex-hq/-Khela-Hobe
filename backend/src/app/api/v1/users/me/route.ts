import { NextRequest } from 'next/server';
import { z } from 'zod';
import { PlayerSkillLevel, UserRole } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import { getEnrichedUserProfile, verifySession } from '@/lib/auth';
import { CACHE_KEYS, cacheGet, cacheSet, invalidateUserCache } from '@/lib/cache';
import { recordAuditLog } from '@/lib/audit';
import { deleteUserAccountSafely } from '@/lib/userDeletion';
import { computeAgeFromDob, normalizeGender } from '@/lib/eligibility';

const sportPrefSchema = z.object({
  sportId: z.string().trim().min(1),
  skillLevel: z
    .enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT', 'PROFESSIONAL'])
    .optional(),
  preferredPosition: z.string().trim().max(120).optional().nullable(),
});

const updateMeSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  phoneNumber: z.string().trim().max(30).optional().nullable(),
  profileImageUrl: z.string().trim().url().max(1000).optional().nullable(),
  bio: z.string().trim().max(1000).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  area: z.string().trim().max(100).optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  age: z.number().int().min(8).max(100).optional().nullable(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'male', 'female', 'other']).optional().nullable(),
  primarySkillLevel: z
    .enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT', 'PROFESSIONAL'])
    .optional(),
  parentalControlEnabled: z.boolean().optional(),
  quickMatchHostEnabled: z.boolean().optional(),
  sportsPreferences: z.array(sportPrefSchema).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const cacheKey = CACHE_KEYS.USER_ME(session.userId);
    const cached = await cacheGet<Awaited<ReturnType<typeof getEnrichedUserProfile>>>(cacheKey);
    if (cached) {
      return ok(cached);
    }

    const dto = await getEnrichedUserProfile(session.userId);
    if (!dto) {
      return fail('RESOURCE_NOT_FOUND', 'User not found', 404);
    }

    await cacheSet(cacheKey, dto, 180);
    return ok(dto);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const body = await request.json();
    const parsed = updateMeSchema.parse(body);

    const existingCurrentUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { emailVerified: true, googleId: true },
    });

    if (parsed.quickMatchHostEnabled === true) {
      const isEmailVerified = Boolean(
        existingCurrentUser?.emailVerified || existingCurrentUser?.googleId
      );
      if (!isEmailVerified) {
        return fail(
          'ACCESS_DENIED',
          'Please verify your email address (OTP or Google account) before enabling Quick Match Host mode.',
          403
        );
      }
    }

    const userData: {
      fullName?: string;
      phoneNumber?: string | null;
      profileImageUrl?: string | null;
      bio?: string | null;
      city?: string | null;
      area?: string | null;
      primarySkillLevel?: PlayerSkillLevel;
      parentalControlEnabled?: boolean;
      quickMatchHostEnabled?: boolean;
      quickMatchHostEnabledAt?: Date;
    } = {};

    if (parsed.fullName !== undefined) userData.fullName = parsed.fullName;
    if (parsed.phoneNumber !== undefined) {
      userData.phoneNumber = parsed.phoneNumber ? parsed.phoneNumber.trim() : null;
    }
    if (parsed.profileImageUrl !== undefined) userData.profileImageUrl = parsed.profileImageUrl;
    if (parsed.bio !== undefined) userData.bio = parsed.bio;
    if (parsed.city !== undefined) userData.city = parsed.city;
    if (parsed.area !== undefined) userData.area = parsed.area;
    if (parsed.primarySkillLevel !== undefined) {
      userData.primarySkillLevel = parsed.primarySkillLevel;
    }
    if (parsed.parentalControlEnabled !== undefined) {
      userData.parentalControlEnabled = parsed.parentalControlEnabled;
    }
    if (parsed.quickMatchHostEnabled !== undefined) {
      userData.quickMatchHostEnabled = parsed.quickMatchHostEnabled;
      if (parsed.quickMatchHostEnabled) {
        userData.quickMatchHostEnabledAt = new Date();
      }
    }

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: userData,
      include: { playerProfile: true },
    });

    if (parsed.parentalControlEnabled === true) {
      await prisma.userRoleAssignment.upsert({
        where: { userId_role: { userId: session.userId, role: UserRole.GUARDIAN } },
        update: {},
        create: { userId: session.userId, role: UserRole.GUARDIAN, grantedBy: session.userId },
      });
    }
    if (parsed.parentalControlEnabled !== undefined) {
      await recordAuditLog({
        userId: session.userId,
        action: parsed.parentalControlEnabled ? 'PARENTAL_CONTROL_ENABLED' : 'PARENTAL_CONTROL_DISABLED',
        entityType: 'USER',
        entityId: session.userId,
        notes: `Parental control ${parsed.parentalControlEnabled ? 'enabled' : 'disabled'} by user`,
        request,
      });
    }
    if (parsed.quickMatchHostEnabled !== undefined) {
      await recordAuditLog({
        userId: session.userId,
        action: parsed.quickMatchHostEnabled ? 'QUICK_MATCH_HOST_ENABLED' : 'QUICK_MATCH_HOST_DISABLED',
        entityType: 'USER',
        entityId: session.userId,
        notes: `Quick Match Host mode ${parsed.quickMatchHostEnabled ? 'enabled' : 'disabled'} by user`,
        request,
      });
    }

    const dob = parsed.dateOfBirth ? new Date(parsed.dateOfBirth) : undefined;
    const validDob = dob && !Number.isNaN(dob.getTime()) ? dob : undefined;
    const normalizedGender =
      parsed.gender !== undefined ? normalizeGender(parsed.gender) : undefined;
    const computedAge =
      parsed.age !== undefined
        ? parsed.age
        : validDob
          ? computeAgeFromDob(validDob)
          : undefined;

    if (user.playerProfile) {
      await prisma.playerProfile.update({
        where: { userId: session.userId },
        data: {
          ...(parsed.fullName !== undefined ? { displayName: parsed.fullName } : {}),
          ...(parsed.bio !== undefined ? { bio: parsed.bio } : {}),
          ...(parsed.city !== undefined && parsed.city !== null ? { city: parsed.city } : {}),
          ...(parsed.area !== undefined ? { area: parsed.area } : {}),
          ...(parsed.primarySkillLevel !== undefined
            ? { skillLevel: parsed.primarySkillLevel }
            : {}),
          ...(validDob ? { dateOfBirth: validDob } : {}),
          ...(computedAge !== undefined ? { age: computedAge } : {}),
          ...(normalizedGender !== undefined ? { gender: normalizedGender } : {}),
        },
      });
    } else {
      await prisma.playerProfile.create({
        data: {
          userId: session.userId,
          displayName: user.fullName,
          bio: user.bio,
          city: user.city || 'Dhaka',
          area: user.area,
          skillLevel: user.primarySkillLevel || 'INTERMEDIATE',
          ...(validDob ? { dateOfBirth: validDob } : {}),
          ...(computedAge !== undefined ? { age: computedAge } : {}),
          ...(normalizedGender !== undefined ? { gender: normalizedGender } : {}),
          safetyProfile: {
            create: { safetyId: `KH-${user.id.slice(-8).toUpperCase()}` },
          },
        },
      });
    }

    if (parsed.sportsPreferences !== undefined) {
      const deduplicated = new Map<
        string,
        { sportId: string; skillLevel: PlayerSkillLevel; positions: string | null }
      >();
      for (const item of parsed.sportsPreferences) {
        deduplicated.set(item.sportId, {
          sportId: item.sportId,
          skillLevel: (item.skillLevel || user.primarySkillLevel || 'INTERMEDIATE') as PlayerSkillLevel,
          positions: item.preferredPosition || null,
        });
      }

      await prisma.playerSport.deleteMany({ where: { playerId: session.userId } });
      if (deduplicated.size > 0) {
        await prisma.playerSport.createMany({
          data: Array.from(deduplicated.values()).map((row) => ({
            playerId: session.userId,
            sportId: row.sportId,
            skillLevel: row.skillLevel,
            positions: row.positions,
          })),
        });
      }
    }

    await invalidateUserCache(session.userId);
    const dto = await getEnrichedUserProfile(session.userId);
    if (dto) {
      await cacheSet(CACHE_KEYS.USER_ME(session.userId), dto, 180);
    }
    return ok(dto);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const result = await deleteUserAccountSafely({
      targetUserId: session.userId,
      actorUserId: session.userId,
      request,
    });

    return ok(result);
  } catch (error) {
    const custom = error as { code?: string; message?: string };
    if (custom?.code === 'CUSTOM_NOT_FOUND') {
      return fail('RESOURCE_NOT_FOUND', custom.message || 'User not found', 404);
    }
    if (custom?.code === 'CUSTOM_BAD_REQUEST') {
      return fail('BAD_REQUEST', custom.message || 'Cannot delete account', 400);
    }
    return handleRouteError(error);
  }
}
