import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok, toEpoch } from '@/lib/http';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ tranId: string }> }
) {
  try {
    const { tranId } = await context.params;
    const tx = await prisma.paymentTransaction.findUnique({
      where: { tranId },
    });

    if (!tx) {
      return fail('RESOURCE_NOT_FOUND', 'Payment transaction not found', 404);
    }

    return ok({
      id: tx.id,
      tranId: tx.tranId,
      valId: tx.valId,
      bankTranId: tx.bankTranId,
      cardType: tx.cardType,
      cardIssuer: tx.cardIssuer,
      amount: tx.amount,
      storeAmount: tx.storeAmount,
      currency: tx.currency,
      purpose: tx.purpose,
      referenceId: tx.referenceId,
      customerName: tx.customerName,
      status: tx.status,
      metadata: tx.metadata,
      paidAt: toEpoch(tx.paidAt),
      createdAt: toEpoch(tx.createdAt),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
