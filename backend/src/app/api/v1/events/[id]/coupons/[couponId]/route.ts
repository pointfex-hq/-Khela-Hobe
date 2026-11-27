import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import { verifySession } from '@/lib/auth';

const patchCouponSchema = z.object({
  active: z.boolean().optional(),
  maxUses: z.number().int().min(1).max(10000).optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; couponId: string }> }
) {
  try {
    const session = await verifySession(request);
    if (!session) return fail('UNAUTHORIZED', 'Authentication required', 401);

    const { id: tournamentId, couponId } = await context.params;
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) return fail('RESOURCE_NOT_FOUND', 'Tournament not found', 404);

    if (tournament.organizerId !== session.userId && !session.roles.includes('ADMIN')) {
      return fail('ACCESS_DENIED', 'Only organizer or admin can update coupons', 403);
    }

    const body = await request.json();
    const parsed = patchCouponSchema.parse(body);

    const updated = await prisma.ticketCoupon.update({
      where: { id: couponId },
      data: parsed,
    });
    return ok(updated);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; couponId: string }> }
) {
  try {
    const session = await verifySession(request);
    if (!session) return fail('UNAUTHORIZED', 'Authentication required', 401);

    const { id: tournamentId, couponId } = await context.params;
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) return fail('RESOURCE_NOT_FOUND', 'Tournament not found', 404);

    if (tournament.organizerId !== session.userId && !session.roles.includes('ADMIN')) {
      return fail('ACCESS_DENIED', 'Only organizer or admin can delete coupons', 403);
    }

    await prisma.ticketCoupon.delete({ where: { id: couponId } });
    return ok({ deleted: true, id: couponId });
  } catch (error) {
    return handleRouteError(error);
  }
}
