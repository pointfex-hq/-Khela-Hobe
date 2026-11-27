import { NextRequest } from 'next/server';
import { z } from 'zod';
import { DiscountType } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok, toEpoch } from '@/lib/http';
import { verifySession, isOrganizerVerifiedForCreation } from '@/lib/auth';
import { resolveSafetyId } from '@/lib/tickets';

const createCouponSchema = z.object({
  code: z.string().trim().min(2).max(40),
  discountType: z.enum(['PERCENTAGE', 'FIXED']).default('PERCENTAGE'),
  discountValue: z.number().positive().max(100000),
  maxUses: z.number().int().min(1).max(10000).optional().default(50),
  eligibleSafetyIds: z.array(z.string().trim()).optional().default([]),
  expiresAt: z.string().optional().nullable(),
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { id } = await context.params;
    const tournament = await prisma.tournament.findUnique({ where: { id } });
    if (!tournament) {
      return fail('RESOURCE_NOT_FOUND', 'Tournament not found', 404);
    }

    const isAdmin = session.roles.includes('ADMIN');
    if (tournament.organizerId !== session.userId && !isAdmin) {
      return fail('ACCESS_DENIED', 'Only the tournament organizer can view coupons', 403);
    }

    const coupons = await prisma.ticketCoupon.findMany({
      where: { tournamentId: id },
      orderBy: { createdAt: 'desc' },
    });

    return ok(
      coupons.map((c) => ({
        id: c.id,
        code: c.code,
        discountType: c.discountType,
        discountValue: c.discountValue,
        maxUses: c.maxUses,
        usedCount: c.usedCount,
        eligibleSafetyIds: c.eligibleSafetyIds,
        eligibleUserIds: c.eligibleUserIds,
        expiresAt: toEpoch(c.expiresAt),
        active: c.active,
        createdAt: toEpoch(c.createdAt),
      }))
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { id } = await context.params;
    const tournament = await prisma.tournament.findUnique({ where: { id } });
    if (!tournament) {
      return fail('RESOURCE_NOT_FOUND', 'Tournament not found', 404);
    }

    const isAdmin = session.roles.includes('ADMIN');
    if (tournament.organizerId !== session.userId && !isAdmin) {
      return fail('ACCESS_DENIED', 'Only the tournament organizer can create coupons', 403);
    }

    const approvalCheck = await isOrganizerVerifiedForCreation(session.userId, session.roles);
    if (!approvalCheck.allowed) {
      return fail('ACCESS_DENIED', approvalCheck.message || 'Organizer verification required', 403);
    }

    const body = await request.json();
    const parsed = createCouponSchema.parse(body);

    const eligibleUserIds: string[] = [];
    const normalizedSafetyIds: string[] = [];

    for (const rawSafety of parsed.eligibleSafetyIds) {
      if (!rawSafety.trim()) continue;
      const resolved = await resolveSafetyId(rawSafety);
      if (!resolved) {
        return fail(
          'VALIDATION_ERROR',
          `Unknown Safety ID in eligible accounts list: "${rawSafety}"`,
          400
        );
      }
      eligibleUserIds.push(resolved.id);
      normalizedSafetyIds.push(resolved.safetyId);
    }

    const expDate = parsed.expiresAt ? new Date(parsed.expiresAt) : null;
    const validExp = expDate && !Number.isNaN(expDate.getTime()) ? expDate : null;

    const created = await prisma.ticketCoupon.create({
      data: {
        tournamentId: id,
        code: parsed.code.toUpperCase(),
        discountType: parsed.discountType as DiscountType,
        discountValue:
          parsed.discountType === 'PERCENTAGE'
            ? Math.min(100, parsed.discountValue)
            : parsed.discountValue,
        maxUses: parsed.maxUses,
        eligibleUserIds,
        eligibleSafetyIds: normalizedSafetyIds,
        expiresAt: validExp,
        active: true,
        createdById: session.userId,
      },
    });

    return ok(
      {
        id: created.id,
        code: created.code,
        discountType: created.discountType,
        discountValue: created.discountValue,
        maxUses: created.maxUses,
        usedCount: created.usedCount,
        eligibleSafetyIds: created.eligibleSafetyIds,
        expiresAt: toEpoch(created.expiresAt),
        active: created.active,
      },
      201
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
