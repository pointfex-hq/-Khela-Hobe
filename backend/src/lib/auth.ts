import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import prisma from './prisma';
import { toEpoch } from './http';
import { CACHE_KEYS, cacheGet, cacheSet } from './cache';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production-123456789';
export const ACCESS_TOKEN_TTL_SECONDS = 86400; // 24 hours
export const REFRESH_TOKEN_TTL_SECONDS = 15 * 24 * 60 * 60; // 15 days

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + '='.repeat(padLen), 'base64').toString('utf8');
}

export interface JwtPayload {
  sub: string;
  roles?: string[];
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}

export function signJwt(payload: Omit<JwtPayload, 'iat' | 'exp'>, ttlSeconds: number): string {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JwtPayload = {
    ...payload,
    iat: now,
    exp: now + ttlSeconds,
  };
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify(fullPayload));
  const sig = base64UrlEncode(
    createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest()
  );
  return `${header}.${body}.${sig}`;
}

export function verifyJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;
    const expectedSig = base64UrlEncode(
      createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest()
    );
    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }
    const decoded = JSON.parse(base64UrlDecode(body)) as JwtPayload;
    if (!decoded.sub || !decoded.exp || decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function signAccessToken(userId: string, roles: string[]): string {
  return signJwt({ sub: userId, roles, type: 'access' }, ACCESS_TOKEN_TTL_SECONDS);
}

export function signRefreshToken(userId: string): string {
  return signJwt({ sub: userId, type: 'refresh' }, REFRESH_TOKEN_TTL_SECONDS);
}

export async function generateSessionToken(): Promise<string> {
  return randomBytes(32).toString('hex');
}

export function generateSafetyId(fullName: string): string {
  const prefix = (fullName || 'USER')
    .replace(/[^A-Za-z]/g, '')
    .toUpperCase()
    .slice(0, 5)
    .padEnd(3, 'X');
  const suffix = randomBytes(2).toString('hex').toUpperCase();
  return `KH-${prefix}${suffix}`;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function invalidateUserSessions(userId: string): Promise<void> {
  await prisma.session.updateMany({
    where: { userId, active: true },
    data: { active: false },
  });
}

export async function verifySession(request: NextRequest): Promise<{
  userId: string;
  roles: string[];
} | null> {
  // 1. Check Authorization: Bearer <accessToken>
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearer = authHeader.slice(7).trim();
    const decoded = verifyJwt(bearer);
    if (decoded && decoded.type === 'access') {
      const sessionKey = CACHE_KEYS.SESSION_USER(decoded.sub);
      const cachedAuth = await cacheGet<{ status: string; roles: string[] }>(sessionKey);
      if (cachedAuth) {
        if (cachedAuth.status !== 'ACTIVE') return null;
        return {
          userId: decoded.sub,
          roles: cachedAuth.roles,
        };
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.sub },
        select: { status: true, roles: { select: { role: true } } },
      });
      if (!user) return null;
      const roles = user.roles.map((r) => r.role);
      await cacheSet(sessionKey, { status: user.status, roles }, 45);
      if (user.status !== 'ACTIVE') return null;
      return {
        userId: decoded.sub,
        roles,
      };
    }
  }

  // 2. Fallback to session_token cookie
  const sessionToken = request.cookies.get('session_token')?.value;
  if (!sessionToken) return null;

  const session = await prisma.session.findUnique({
    where: { token: sessionToken },
    include: {
      user: {
        include: { roles: true },
      },
    },
  });

  if (!session || !session.active || session.expiresAt < new Date() || session.user.status !== 'ACTIVE') {
    return null;
  }

  return {
    userId: session.userId,
    roles: session.user.roles.map((r) => r.role),
  };
}

export function toUserDto(user: {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  profileImageUrl: string | null;
  bio: string | null;
  city: string | null;
  area: string | null;
  primarySkillLevel: string | null;
  passwordHash?: string | null;
  googleId?: string | null;
  googleEmail?: string | null;
  googleLinkedAt?: Date | null;
  emailVerified?: boolean;
  parentalControlEnabled?: boolean;
  organizerApprovalStatus?: string | null;
  organizerApprovalNote?: string | null;
  quickMatchHostEnabled?: boolean;
  quickMatchHostEnabledAt?: Date | null;
  status: string;
  createdAt: Date;
  roles?: Array<{ role: string }>;
  playerProfile?: {
    bio?: string | null;
    city?: string | null;
    area?: string | null;
    skillLevel?: string | null;
    safetyProfile?: { safetyId: string } | null;
  } | null;
}) {
  const ROLE_PRIORITY: Record<string, number> = {
    ADMIN: 0,
    ORGANIZER: 1,
    PLAYER: 2,
    GUARDIAN: 3,
  };
  const roles =
    user.roles && user.roles.length > 0
      ? user.roles
          .map((r) => r.role)
          .sort((a, b) => (ROLE_PRIORITY[a] ?? 99) - (ROLE_PRIORITY[b] ?? 99))
      : ['PLAYER'];
  const approvalStatus = user.organizerApprovalStatus ?? 'NONE';
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phoneNumber: user.phoneNumber ?? null,
    profileImageUrl: user.profileImageUrl ?? null,
    bio: user.bio ?? user.playerProfile?.bio ?? null,
    city: user.city ?? user.playerProfile?.city ?? null,
    area: user.area ?? user.playerProfile?.area ?? null,
    safetyId: user.playerProfile?.safetyProfile?.safetyId ?? `KH-${user.id.slice(-8).toUpperCase()}`,
    roles,
    primarySkillLevel: user.primarySkillLevel ?? user.playerProfile?.skillLevel ?? null,
    emailVerified: Boolean(user.emailVerified),
    parentalControlEnabled: Boolean(user.parentalControlEnabled),
    organizerApprovalStatus: approvalStatus,
    organizerApprovalNote: user.organizerApprovalNote ?? null,
    isVerifiedOrganizer: approvalStatus === 'APPROVED',
    quickMatchHostEnabled: Boolean(user.quickMatchHostEnabled),
    quickMatchHostEnabledAt: toEpoch(user.quickMatchHostEnabledAt),
    googleLinked: Boolean(user.googleId),
    googleEmail: user.googleEmail ?? null,
    googleLinkedAt: toEpoch(user.googleLinkedAt),
    hasPassword: Boolean(user.passwordHash),
    active: user.status === 'ACTIVE',
    createdAt: toEpoch(user.createdAt),
  };
}

export const MIN_MATCHES_FOR_ORGANIZER_APPLY = 3;

export async function isOrganizerVerifiedForCreation(
  userId: string,
  roles: string[]
): Promise<{ allowed: boolean; message?: string }> {
  if (roles.includes('ADMIN')) {
    return { allowed: true };
  }
  if (!roles.includes('ORGANIZER')) {
    return {
      allowed: false,
      message:
        'Only verified Full Organizers can access Events, Tournaments, Tickets, Coupons, and Venue Management.',
    };
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizerApprovalStatus: true },
  });
  if (!user) {
    return { allowed: false, message: 'User account not found' };
  }
  if (user.organizerApprovalStatus !== 'APPROVED') {
    return {
      allowed: false,
      message:
        user.organizerApprovalStatus === 'REJECTED'
          ? 'Your Organizer verification request was rejected. Contact support or an Admin.'
          : 'Your Organizer account is pending Admin approval. You can preview features while verification is in review.',
    };
  }
  return { allowed: true };
}

export async function isQuickMatchHostAllowed(
  userId: string,
  roles: string[]
): Promise<{ allowed: boolean; isFullOrganizer: boolean; message?: string }> {
  if (roles.includes('ADMIN')) {
    return { allowed: true, isFullOrganizer: true };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      emailVerified: true,
      quickMatchHostEnabled: true,
      organizerApprovalStatus: true,
    },
  });

  if (!user) {
    return { allowed: false, isFullOrganizer: false, message: 'User account not found' };
  }

  if (roles.includes('ORGANIZER')) {
    if (user.organizerApprovalStatus === 'APPROVED') {
      return { allowed: true, isFullOrganizer: true };
    }
    return {
      allowed: false,
      isFullOrganizer: false,
      message:
        user.organizerApprovalStatus === 'REJECTED'
          ? 'Your Organizer verification request was rejected. Contact support or an Admin.'
          : 'Your Organizer account is pending Admin approval. You can preview features while verification is in review.',
    };
  }

  if (!user.emailVerified) {
    return {
      allowed: false,
      isFullOrganizer: false,
      message: 'Please verify your email address before hosting Quick Matches.',
    };
  }

  if (!user.quickMatchHostEnabled) {
    return {
      allowed: false,
      isFullOrganizer: false,
      message: 'Enable "Quick Match Host" mode from your Player Profile to create matches.',
    };
  }

  return { allowed: true, isFullOrganizer: false };
}

export async function getEnrichedUserProfile(userId: string) {
  let user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: true,
      playerProfile: {
        include: { safetyProfile: true },
      },
    },
  });

  if (!user) return null;

  // Ensure every player has a persisted PlayerProfile + SafetyProfile with a lookupable safetyId
  if (!user.playerProfile) {
    const safetyId = `KH-${user.id.slice(-8).toUpperCase()}`;
    await prisma.playerProfile.create({
      data: {
        userId: user.id,
        displayName: user.fullName,
        bio: user.bio,
        city: user.city || 'Dhaka',
        area: user.area,
        skillLevel: user.primarySkillLevel || 'INTERMEDIATE',
        safetyProfile: {
          create: { safetyId },
        },
      },
    });
    user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        roles: true,
        playerProfile: {
          include: { safetyProfile: true },
        },
      },
    });
  } else if (!user.playerProfile.safetyProfile) {
    const safetyId = `KH-${user.id.slice(-8).toUpperCase()}`;
    await prisma.safetyProfile.upsert({
      where: { playerProfileId: user.playerProfile.id },
      update: {},
      create: {
        playerProfileId: user.playerProfile.id,
        safetyId,
      },
    });
    user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        roles: true,
        playerProfile: {
          include: { safetyProfile: true },
        },
      },
    });
  }

  const now = new Date();
  const [participations, organizedCount, completedHostedMatches, playerSports, allSports, receivedRatings] =
    await Promise.all([
      prisma.matchParticipant.findMany({
        where: {
          userId,
          status: { in: ['CONFIRMED', 'NO_SHOW'] },
          leftAt: null,
        },
        orderBy: { joinedAt: 'desc' },
        include: {
          match: {
            select: {
              id: true,
              title: true,
              startTime: true,
              city: true,
              area: true,
              status: true,
              sport: { select: { name: true } },
            },
          },
        },
      }),
      prisma.match.count({ where: { organizerId: userId } }),
      prisma.match.count({
        where: {
          organizerId: userId,
          status: { not: 'CANCELLED' },
          OR: [{ status: 'COMPLETED' }, { endTime: { lte: now } }],
        },
      }),
      prisma.playerSport.findMany({
        where: { playerId: userId },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.sport.findMany({
        where: { active: true },
        select: { id: true, name: true, slug: true, iconUrl: true },
      }),
      prisma.userRating.findMany({
        where: { targetUserId: userId },
        orderBy: { createdAt: 'desc' },
        take: 25,
        include: {
          rater: { select: { id: true, fullName: true, profileImageUrl: true } },
          match: { select: { id: true, title: true } },
        },
      }),
    ]);

  const orgRatings = receivedRatings.filter((r) => r.contextRole === 'PLAYER_TO_ORGANIZER');
  const plyRatings = receivedRatings.filter((r) => r.contextRole === 'ORGANIZER_TO_PLAYER');
  const calcAvg = (list: typeof receivedRatings) =>
    list.length > 0 ? Number((list.reduce((s, r) => s + r.score, 0) / list.length).toFixed(2)) : null;

  const baseDto = toUserDto(user);
  const canApplyForOrganizer =
    completedHostedMatches >= MIN_MATCHES_FOR_ORGANIZER_APPLY &&
    !baseDto.roles.includes('ORGANIZER') &&
    baseDto.organizerApprovalStatus !== 'PENDING' &&
    baseDto.emailVerified;

  const confirmedCount = participations.filter((p) => p.status === 'CONFIRMED').length;
  const noShowCount = participations.filter((p) => p.status === 'NO_SHOW').length;
  const totalDecisions = confirmedCount + noShowCount;
  const showUpRate =
    totalDecisions > 0 ? Math.round((confirmedCount / totalDecisions) * 100) : 100;

  const sportById = new Map(allSports.map((s) => [s.id, s]));
  const sportsPreferences = playerSports.map((ps, index) => {
    const matched = sportById.get(ps.sportId);
    return {
      id: ps.id,
      sportId: ps.sportId,
      sport: matched?.name || ps.sportId,
      iconUrl: matched?.iconUrl ?? null,
      skillLevel: ps.skillLevel,
      preferredPosition: ps.positions ?? '',
      preferredFormat: ps.positions ?? '',
      isPrimary: index === 0,
    };
  });

  const matchHistory = participations.slice(0, 12).map((p) => ({
    id: p.id,
    matchId: p.matchId,
    title: p.match.title,
    sport: p.match.sport?.name || 'Match',
    date: toEpoch(p.match.startTime),
    role: 'Player',
    status: p.status === 'NO_SHOW' ? 'Did Not Show Up' : 'Confirmed',
  }));

  return {
    ...baseDto,
    canApplyForOrganizer,
    organizerEligibilityThreshold: MIN_MATCHES_FOR_ORGANIZER_APPLY,
    ratings: {
      overallAvg: calcAvg(receivedRatings),
      overallCount: receivedRatings.length,
      playerRatingAvg: calcAvg(plyRatings),
      playerRatingCount: plyRatings.length,
      organizerRatingAvg: calcAvg(orgRatings),
      organizerRatingCount: orgRatings.length,
      recent: receivedRatings.slice(0, 8).map((r) => ({
        id: r.id,
        score: r.score,
        comment: r.comment,
        contextRole: r.contextRole,
        raterName: r.rater?.fullName || 'Khela Hobe Member',
        raterAvatar: r.rater?.profileImageUrl ?? null,
        matchTitle: r.match?.title || null,
        createdAt: toEpoch(r.createdAt),
      })),
    },
    stats: {
      matchesPlayed: confirmedCount,
      matchesOrganized: organizedCount,
      completedHostedMatches,
      noShowCount,
      showUpRate,
      playerRating: calcAvg(orgRatings) ?? calcAvg(receivedRatings) ?? 0,
    },
    sportsPreferences,
    matchHistory,
  };
}
