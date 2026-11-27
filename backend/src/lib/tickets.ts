import { randomBytes } from 'crypto';
import prisma from '@/lib/prisma';

export function generateTicketCode(): string {
  return `KH-TKT-${randomBytes(3).toString('hex').toUpperCase()}`;
}

export function computeTournamentExpiry(startDate?: string | null): Date | null {
  if (!startDate) return null;
  const isoMatch = /^(\d{4}-\d{2}-\d{2})/.exec(startDate.trim());
  if (!isoMatch) return null;
  const parsed = new Date(`${isoMatch[1]}T23:59:59+06:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export interface ResolvedSafetyPlayer {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  profileImageUrl: string | null;
  city: string | null;
  area: string | null;
  safetyId: string;
}

export async function resolveSafetyId(rawSafetyId: string): Promise<ResolvedSafetyPlayer | null> {
  const normalized = rawSafetyId.trim().toUpperCase();
  if (!normalized) return null;

  const sp = await prisma.safetyProfile.findUnique({
    where: { safetyId: normalized },
    include: {
      playerProfile: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneNumber: true,
              profileImageUrl: true,
              city: true,
              area: true,
            },
          },
        },
      },
    },
  });

  if (sp?.playerProfile?.user) {
    return {
      ...sp.playerProfile.user,
      safetyId: sp.safetyId,
    };
  }

  if (normalized.startsWith('KH-') && normalized.length >= 6) {
    const suffix = normalized.slice(3).toLowerCase();
    const matchedUser = await prisma.user.findFirst({
      where: { id: { endsWith: suffix } },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        profileImageUrl: true,
        city: true,
        area: true,
        primarySkillLevel: true,
        bio: true,
        playerProfile: { include: { safetyProfile: true } },
      },
    });
    if (matchedUser) {
      if (!matchedUser.playerProfile) {
        await prisma.playerProfile.create({
          data: {
            userId: matchedUser.id,
            displayName: matchedUser.fullName,
            bio: matchedUser.bio,
            city: matchedUser.city || 'Dhaka',
            area: matchedUser.area,
            skillLevel: matchedUser.primarySkillLevel || 'INTERMEDIATE',
            safetyProfile: { create: { safetyId: normalized } },
          },
        });
      } else if (!matchedUser.playerProfile.safetyProfile) {
        await prisma.safetyProfile.create({
          data: {
            playerProfileId: matchedUser.playerProfile.id,
            safetyId: normalized,
          },
        });
      }
      return {
        id: matchedUser.id,
        fullName: matchedUser.fullName,
        email: matchedUser.email,
        phoneNumber: matchedUser.phoneNumber,
        profileImageUrl: matchedUser.profileImageUrl,
        city: matchedUser.city,
        area: matchedUser.area,
        safetyId: normalized,
      };
    }
  }

  return null;
}

export async function validateAndComputeCoupon({
  tournamentId,
  couponCode,
  userId,
  unitPrice,
  quantity,
}: {
  tournamentId: string;
  couponCode?: string | null;
  userId?: string | null;
  unitPrice: number;
  quantity: number;
}) {
  const subtotal = Math.max(0, unitPrice * quantity);
  const cleanCode = couponCode?.trim().toUpperCase();
  if (!cleanCode) {
    return {
      coupon: null,
      subtotal,
      discountAmount: 0,
      finalPrice: subtotal,
    };
  }

  const coupon = await prisma.ticketCoupon.findUnique({
    where: {
      tournamentId_code: {
        tournamentId,
        code: cleanCode,
      },
    },
  });

  if (!coupon || !coupon.active) {
    throw new Error('Coupon code is invalid or inactive for this tournament.');
  }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    throw new Error('This coupon code has expired.');
  }
  if (coupon.usedCount >= coupon.maxUses) {
    throw new Error('This coupon has reached its maximum usage limit.');
  }

  const hasAccountRestriction =
    coupon.eligibleUserIds.length > 0 || coupon.eligibleSafetyIds.length > 0;
  if (hasAccountRestriction) {
    if (!userId) {
      throw new Error('Please sign in with an eligible account to use this coupon.');
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { playerProfile: { include: { safetyProfile: true } } },
    });
    const userSafetyId = (
      user?.playerProfile?.safetyProfile?.safetyId ||
      `KH-${userId.slice(-8)}`
    ).toUpperCase();
    const isEligible =
      coupon.eligibleUserIds.includes(userId) ||
      coupon.eligibleSafetyIds.map((s) => s.toUpperCase()).includes(userSafetyId);
    if (!isEligible) {
      throw new Error('Your account is not eligible for this private discount coupon.');
    }
  }

  let discountAmount = 0;
  if (coupon.discountType === 'PERCENTAGE') {
    discountAmount = Math.round((subtotal * Math.min(100, coupon.discountValue)) / 100);
  } else {
    discountAmount = Math.round(coupon.discountValue);
  }
  discountAmount = Math.min(subtotal, Math.max(0, discountAmount));
  const finalPrice = Math.max(0, subtotal - discountAmount);

  return {
    coupon,
    subtotal,
    discountAmount,
    finalPrice,
  };
}
