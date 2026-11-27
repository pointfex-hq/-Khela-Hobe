import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok, toEpoch } from '@/lib/http';
import { verifySession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const items = await prisma.paymentTransaction.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return ok(
      items.map((tx) => ({
        id: tx.id,
        tranId: tx.tranId,
        amount: tx.amount,
        currency: tx.currency,
        purpose: tx.purpose,
        referenceId: tx.referenceId,
        cardType: tx.cardType,
        cardIssuer: tx.cardIssuer,
        bankTranId: tx.bankTranId,
        status: tx.status,
        paidAt: toEpoch(tx.paidAt),
        createdAt: toEpoch(tx.createdAt),
      }))
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
