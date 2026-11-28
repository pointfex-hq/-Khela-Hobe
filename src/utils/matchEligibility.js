/**
 * Shared client-side helpers for player Age & Gender profile fields
 * and Match Eligibility requirements (genderRestriction, minAge, maxAge).
 */

export const PROFILE_GENDER_OPTIONS = [
  { value: 'MALE', label: 'Boy / Male' },
  { value: 'FEMALE', label: 'Girl / Female' },
  { value: 'OTHER', label: 'Other' },
];

export const MATCH_GENDER_OPTIONS = [
  { value: 'ALL', label: 'All Genders (Boys & Girls)' },
  { value: 'BOYS_ONLY', label: 'Boys Only' },
  { value: 'GIRLS_ONLY', label: 'Girls Only' },
];

export function normalizeProfileGender(raw) {
  if (!raw) return '';
  const v = String(raw).trim().toUpperCase();
  if (['MALE', 'BOY', 'BOYS', 'M', 'MAN', 'MEN'].includes(v)) return 'MALE';
  if (['FEMALE', 'GIRL', 'GIRLS', 'F', 'WOMAN', 'WOMEN'].includes(v)) return 'FEMALE';
  if (v === 'OTHER') return 'OTHER';
  return '';
}

export function formatProfileGenderLabel(raw) {
  const g = normalizeProfileGender(raw);
  if (g === 'MALE') return 'Boy / Male';
  if (g === 'FEMALE') return 'Girl / Female';
  if (g === 'OTHER') return 'Other';
  return 'Not specified';
}

export function formatMatchGenderLabel(genderRestriction) {
  const r = String(genderRestriction || 'ALL').toUpperCase();
  if (r === 'BOYS_ONLY') return 'Boys Only';
  if (r === 'GIRLS_ONLY') return 'Girls Only';
  return 'All Genders';
}

export function formatMatchAgeLabel(minAge = 0, maxAge = 99) {
  const min = Number.isFinite(Number(minAge)) ? Number(minAge) : 0;
  const max = Number.isFinite(Number(maxAge)) ? Number(maxAge) : 99;
  if (min <= 0 && max >= 99) return 'All Ages';
  if (min > 0 && max < 99) return `Ages ${min}–${max}`;
  if (min > 0) return `${min}+ yrs`;
  return `Up to ${max} yrs`;
}

export function isUserEligibleForMatch(user, match) {
  if (!match) return { eligible: true };
  const roles = Array.isArray(user?.roles) ? user.roles : user?.role ? [user.role] : [];
  if (roles.includes('ADMIN')) return { eligible: true };
  if (user?.id && match.organizer?.id === user.id) return { eligible: true };

  const restriction = String(match.genderRestriction || 'ALL').toUpperCase();
  const userGender = normalizeProfileGender(user?.gender);

  if (restriction === 'BOYS_ONLY') {
    if (!userGender) {
      return {
        eligible: false,
        code: 'GENDER_REQUIRED',
        reason: 'Boys Only match — set your Gender in My Profile to view and join.',
      };
    }
    if (userGender !== 'MALE') {
      return {
        eligible: false,
        code: 'GENDER_MISMATCH',
        reason: 'This match is restricted to Boys / Male players only.',
      };
    }
  } else if (restriction === 'GIRLS_ONLY') {
    if (!userGender) {
      return {
        eligible: false,
        code: 'GENDER_REQUIRED',
        reason: 'Girls Only match — set your Gender in My Profile to view and join.',
      };
    }
    if (userGender !== 'FEMALE') {
      return {
        eligible: false,
        code: 'GENDER_MISMATCH',
        reason: 'This match is restricted to Girls / Female players only.',
      };
    }
  }

  const minAge = typeof match.minAge === 'number' ? match.minAge : 0;
  const maxAge = typeof match.maxAge === 'number' ? match.maxAge : 99;
  if (minAge > 0 || maxAge < 99) {
    const userAge = typeof user?.age === 'number' ? user.age : null;
    if (userAge === null) {
      return {
        eligible: false,
        code: 'AGE_REQUIRED',
        reason: `Requires age ${minAge}–${maxAge} yrs — update your Age in My Profile to join.`,
      };
    }
    if (userAge < minAge || userAge > maxAge) {
      return {
        eligible: false,
        code: 'AGE_MISMATCH',
        reason: `Your age (${userAge}) is outside the ${minAge}–${maxAge} yrs requirement.`,
      };
    }
  }

  return { eligible: true };
}
