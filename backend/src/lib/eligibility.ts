import { MatchGenderRestriction, Prisma } from '@prisma/client';
import prisma from './prisma';

export type CanonicalGender = 'MALE' | 'FEMALE' | 'OTHER';

export interface ViewerEligibilityProfile {
  userId: string;
  roles: string[];
  gender: CanonicalGender | null;
  age: number | null;
}

export function normalizeGender(raw?: string | null): CanonicalGender | null {
  if (!raw) return null;
  const val = String(raw).trim().toUpperCase();
  if (['MALE', 'BOY', 'BOYS', 'M', 'MAN', 'MEN'].includes(val)) return 'MALE';
  if (['FEMALE', 'GIRL', 'GIRLS', 'F', 'WOMAN', 'WOMEN'].includes(val)) return 'FEMALE';
  if (['OTHER', 'NON_BINARY', 'PREFER_NOT_TO_SAY'].includes(val)) return 'OTHER';
  return null;
}

export function computeAgeFromDob(dob?: Date | string | null): number | null {
  if (!dob) return null;
  const date = dob instanceof Date ? dob : new Date(dob);
  if (Number.isNaN(date.getTime())) return null;
  const now = new Date();
  let years = now.getUTCFullYear() - date.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - date.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < date.getUTCDate())) {
    years -= 1;
  }
  return years >= 5 && years <= 100 ? years : null;
}

export function resolveProfileAge(profile?: {
  age?: number | null;
  dateOfBirth?: Date | string | null;
} | null): number | null {
  if (!profile) return null;
  if (typeof profile.age === 'number' && Number.isFinite(profile.age) && profile.age > 0) {
    return profile.age;
  }
  return computeAgeFromDob(profile.dateOfBirth);
}

export async function getViewerEligibilityProfile(
  session: { userId: string; roles: string[] } | null
): Promise<ViewerEligibilityProfile | null> {
  if (!session) return null;
  const profile = await prisma.playerProfile.findUnique({
    where: { userId: session.userId },
    select: { gender: true, age: true, dateOfBirth: true },
  });
  return {
    userId: session.userId,
    roles: session.roles,
    gender: normalizeGender(profile?.gender),
    age: resolveProfileAge(profile),
  };
}

export function buildMatchEligibilityWhere(
  viewer: ViewerEligibilityProfile | null
): Prisma.MatchWhereInput | null {
  if (viewer?.roles.includes('ADMIN')) {
    return null;
  }

  const allowedGenders: MatchGenderRestriction[] = [MatchGenderRestriction.ALL];
  if (viewer?.gender === 'MALE') {
    allowedGenders.push(MatchGenderRestriction.BOYS_ONLY);
  } else if (viewer?.gender === 'FEMALE') {
    allowedGenders.push(MatchGenderRestriction.GIRLS_ONLY);
  }

  const restrictionConditions: Prisma.MatchWhereInput = {
    genderRestriction: { in: allowedGenders },
    ...(typeof viewer?.age === 'number'
      ? {
          minAge: { lte: viewer.age },
          maxAge: { gte: viewer.age },
        }
      : {
          minAge: { lte: 0 },
          maxAge: { gte: 99 },
        }),
  };

  if (viewer?.userId) {
    return {
      OR: [{ organizerId: viewer.userId }, restrictionConditions],
    };
  }

  return restrictionConditions;
}

export function checkMatchEligibility(
  viewer: ViewerEligibilityProfile | null,
  match: {
    organizerId: string;
    genderRestriction?: string | null;
    minAge?: number | null;
    maxAge?: number | null;
  }
): {
  eligible: boolean;
  code?: 'GENDER_REQUIRED' | 'GENDER_MISMATCH' | 'AGE_REQUIRED' | 'AGE_MISMATCH';
  reason?: string;
} {
  if (viewer?.roles.includes('ADMIN')) {
    return { eligible: true };
  }
  if (viewer?.userId && match.organizerId === viewer.userId) {
    return { eligible: true };
  }

  const restriction = String(match.genderRestriction || 'ALL').toUpperCase();
  if (restriction === 'BOYS_ONLY') {
    if (!viewer?.gender) {
      return {
        eligible: false,
        code: 'GENDER_REQUIRED',
        reason: 'This match is Boys Only. Please add your Gender in My Profile to join.',
      };
    }
    if (viewer.gender !== 'MALE') {
      return {
        eligible: false,
        code: 'GENDER_MISMATCH',
        reason: 'This match is open to Boys / Male players only.',
      };
    }
  } else if (restriction === 'GIRLS_ONLY') {
    if (!viewer?.gender) {
      return {
        eligible: false,
        code: 'GENDER_REQUIRED',
        reason: 'This match is Girls Only. Please add your Gender in My Profile to join.',
      };
    }
    if (viewer.gender !== 'FEMALE') {
      return {
        eligible: false,
        code: 'GENDER_MISMATCH',
        reason: 'This match is open to Girls / Female players only.',
      };
    }
  }

  const minAge = typeof match.minAge === 'number' ? match.minAge : 0;
  const maxAge = typeof match.maxAge === 'number' ? match.maxAge : 99;
  const hasAgeLimit = minAge > 0 || maxAge < 99;

  if (hasAgeLimit) {
    if (typeof viewer?.age !== 'number') {
      return {
        eligible: false,
        code: 'AGE_REQUIRED',
        reason: `This match requires age ${minAge}–${maxAge}. Please update your Age in My Profile to join.`,
      };
    }
    if (viewer.age < minAge || viewer.age > maxAge) {
      return {
        eligible: false,
        code: 'AGE_MISMATCH',
        reason: `Your profile age (${viewer.age}) is outside this match's allowed range (${minAge}–${maxAge} yrs).`,
      };
    }
  }

  return { eligible: true };
}
