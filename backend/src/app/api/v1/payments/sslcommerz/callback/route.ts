import { NextRequest, NextResponse } from 'next/server';
import { PaymentStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import {
  confirmMatchParticipationAfterPayment,
  extractCallbackParams,
  getSslcommerzConfig,
  validateSslcommerzTransaction,
} from '@/lib/sslcommerz';

async function parseFormBody(request: NextRequest): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  try {
    const text = await request.text();
    if (!text) return result;
    const params = new URLSearchParams(text);
    params.forEach((value, key) => {
      result[key] = value;
    });
  } catch {
    // Ignore empty or non-form bodies
  }
  return result;
}

async function handleCallback(request: NextRequest) {
  const cfg = getSslcommerzConfig();
  const { searchParams } = new URL(request.url);
  const bodyParams = request.method === 'POST' ? await parseFormBody(request) : {};
  const info = extractCallbackParams(searchParams, bodyParams);

  const redirectUrl = new URL(`${cfg.frontendUrl}/payment/status`);
  if (info.tranId) {
    redirectUrl.searchParams.set('tranId', info.tranId);
  }

  if (!info.tranId) {
    redirectUrl.searchParams.set('status', 'failed');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const txRecord = await prisma.paymentTransaction.findUnique({
    where: { tranId: info.tranId },
  });

  if (!txRecord) {
    redirectUrl.searchParams.set('status', 'failed');
    return NextResponse.redirect(redirectUrl, 303);
  }

  if (info.outcome === 'cancel' || info.status === 'CANCELLED') {
    await prisma.paymentTransaction.update({
      where: { id: txRecord.id },
      data: {
        status: PaymentStatus.CANCELLED,
        rawResponse: info.rawPayload,
      },
    });
    redirectUrl.searchParams.set('status', 'cancelled');
    return NextResponse.redirect(redirectUrl, 303);
  }

  if (info.outcome === 'fail' || info.status === 'FAILED') {
    await prisma.paymentTransaction.update({
      where: { id: txRecord.id },
      data: {
        status: PaymentStatus.FAILED,
        rawResponse: info.rawPayload,
      },
    });
    redirectUrl.searchParams.set('status', 'failed');
    return NextResponse.redirect(redirectUrl, 303);
  }

  // Validate against SSLCommerz Validation API
  if (info.valId) {
    try {
      const validation = await validateSslcommerzTransaction(info.valId);
      const validStatus =
        validation.status === 'VALID' || validation.status === 'VALIDATED';
      const paidAmount = validation.amount ? Number(validation.amount) : txRecord.amount;
      const amountMatches = Math.abs(paidAmount - txRecord.amount) < 0.5;

      if (validStatus && amountMatches) {
        const updated = await prisma.paymentTransaction.update({
          where: { id: txRecord.id },
          data: {
            status: PaymentStatus.VALIDATED,
            valId: validation.val_id || info.valId,
            bankTranId: validation.bank_tran_id || info.bankTranId,
            cardType: validation.card_type || info.cardType,
            cardIssuer: validation.card_issuer || info.cardIssuer,
            storeAmount: validation.store_amount
              ? Number(validation.store_amount)
              : info.storeAmount,
            paidAt: new Date(),
            rawResponse: validation as object,
          },
        });

        await confirmMatchParticipationAfterPayment(updated);
        redirectUrl.searchParams.set('status', 'success');
        return NextResponse.redirect(redirectUrl, 303);
      }
    } catch (err) {
      console.error('[SSLCommerz Validation Error]', err);
    }
  }

  await prisma.paymentTransaction.update({
    where: { id: txRecord.id },
    data: {
      status: PaymentStatus.FAILED,
      valId: info.valId || null,
      rawResponse: info.rawPayload,
    },
  });

  redirectUrl.searchParams.set('status', 'failed');
  return NextResponse.redirect(redirectUrl, 303);
}

export async function POST(request: NextRequest) {
  return handleCallback(request);
}

export async function GET(request: NextRequest) {
  return handleCallback(request);
}
