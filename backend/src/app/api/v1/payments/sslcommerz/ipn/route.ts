import { NextRequest, NextResponse } from 'next/server';
import { PaymentStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import {
  confirmMatchParticipationAfterPayment,
  validateSslcommerzTransaction,
} from '@/lib/sslcommerz';

export async function POST(request: NextRequest) {
  try {
    const rawText = await request.text();
    const params = new URLSearchParams(rawText);
    const tranId = params.get('tran_id') || '';
    const valId = params.get('val_id') || '';
    const ipnStatus = (params.get('status') || '').toUpperCase();

    if (!tranId) {
      return NextResponse.json({ received: false, message: 'Missing tran_id' }, { status: 400 });
    }

    const txRecord = await prisma.paymentTransaction.findUnique({
      where: { tranId },
    });

    if (!txRecord) {
      return NextResponse.json({ received: false, message: 'Transaction not found' }, { status: 404 });
    }

    if (txRecord.status === PaymentStatus.VALIDATED) {
      return NextResponse.json({ received: true, status: 'ALREADY_VALIDATED' });
    }

    if (valId && (ipnStatus === 'VALID' || ipnStatus === 'VALIDATED')) {
      const validation = await validateSslcommerzTransaction(valId);
      const validStatus =
        validation.status === 'VALID' || validation.status === 'VALIDATED';
      const paidAmount = validation.amount ? Number(validation.amount) : txRecord.amount;

      if (validStatus && Math.abs(paidAmount - txRecord.amount) < 0.5) {
        const updated = await prisma.paymentTransaction.update({
          where: { id: txRecord.id },
          data: {
            status: PaymentStatus.VALIDATED,
            valId: validation.val_id || valId,
            bankTranId: validation.bank_tran_id || params.get('bank_tran_id') || null,
            cardType: validation.card_type || params.get('card_type') || null,
            cardIssuer: validation.card_issuer || params.get('card_issuer') || null,
            storeAmount: validation.store_amount ? Number(validation.store_amount) : null,
            paidAt: new Date(),
            rawResponse: validation as object,
          },
        });
        await confirmMatchParticipationAfterPayment(updated);
        return NextResponse.json({ received: true, status: 'VALIDATED' });
      }
    }

    const nextStatus =
      ipnStatus === 'CANCELLED' ? PaymentStatus.CANCELLED : PaymentStatus.FAILED;
    await prisma.paymentTransaction.update({
      where: { id: txRecord.id },
      data: {
        status: nextStatus,
        valId: valId || null,
        rawResponse: Object.fromEntries(params.entries()),
      },
    });

    return NextResponse.json({ received: true, status: nextStatus });
  } catch (err) {
    console.error('[SSLCommerz IPN Error]', err);
    return NextResponse.json({ received: false }, { status: 500 });
  }
}
