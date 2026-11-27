import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { validateAndComputeCoupon } from '@/lib/tickets';

const validateSchema = z.object({
  code: z.string().trim().min(1),
  unitPrice: z.number().min(0),
  quantity: z.number().int().min(1).max(20).default(1),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession(request);
    const { id } = await context.params;
    const tournament = await prisma.tournament.findUnique({ where: { id }, select: { id: true } });
    if (!tournament) {
      return fail('RESOURCE_NOT_FOUND', 'Tournament not found', 404);
    }

    const body = await request.json();
    const parsed = validateSchema.parse(body);

    const result = await validateAndComputeCoupon({
      tournamentId: id,
      couponCode: parsed.code,
      userId: session?.userId ?? null,
      unitPrice: parsed.unitPrice,
      quantity: parsed.quantity,
    });

    return ok({
      valid: true,
      code: result.coupon?.code || parsed.code.toUpperCase(),
      discountType: result.coupon?.discountType,
      discountValue: result.coupon?.discountValue,
      subtotal: result.subtotal,
      discountAmount: result.discountAmount,
      finalPrice: result.finalPrice,
    });
  } catch (error) {
    if (error instanceof Error && !error.message.includes('Prisma')) {
      return fail('COUPON_INVALID', error.message, 400);
    }
    return handleRouteError(error);
  }
}
