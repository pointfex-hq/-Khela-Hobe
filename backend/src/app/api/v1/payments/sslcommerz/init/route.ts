import { NextRequest } from 'next/server';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import {
  getSslcommerzConfig,
  initiateSslcommerzSession,
  isSslcommerzConfigured,
} from '@/lib/sslcommerz';

import { validateAndComputeCoupon } from '@/lib/tickets';
import { checkMatchEligibility, getViewerEligibilityProfile } from '@/lib/eligibility';

const initPaymentSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0').max(500000).optional(),
  currency: z.enum(['BDT']).optional(),
  purpose: z.enum(['MATCH_FEE', 'EVENT_TICKET', 'TOURNAMENT_FEE', 'GENERAL']).optional(),
  referenceId: z.string().trim().max(120).optional(),
  matchId: z.string().trim().max(120).optional(),
  eventId: z.string().trim().max(120).optional(),
  registrationId: z.string().trim().max(120).optional(),
  productName: z.string().trim().max(200).optional(),
  productCategory: z.string().trim().max(80).optional(),
  customerName: z.string().trim().max(100).optional(),
  customerEmail: z.string().trim().email().optional(),
  customerPhone: z.string().trim().max(30).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession(request);
    const body = await request.json();
    const parsed = initPaymentSchema.parse(body);

    const purpose =
      parsed.purpose ??
      (parsed.matchId
        ? 'MATCH_FEE'
        : parsed.registrationId
          ? 'TOURNAMENT_FEE'
          : parsed.eventId
            ? 'EVENT_TICKET'
            : 'GENERAL');
    const referenceId =
      parsed.referenceId || parsed.matchId || parsed.registrationId || parsed.eventId || null;

    if (!isSslcommerzConfigured()) {
      return fail(
        'SSLCOMMERZ_NOT_CONFIGURED',
        'SSLCommerz sandbox credentials are not configured. Set SSLCOMMERZ_STORE_ID and SSLCOMMERZ_STORE_PASSWORD in backend/.env.',
        503
      );
    }

    let userRecord = null;
    if (session) {
      userRecord = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { id: true, fullName: true, email: true, phoneNumber: true, city: true },
      });
    }

    let amount = parsed.amount ?? 0;
    let productName = parsed.productName || 'Khela Hobe Booking';
    let customerCity = userRecord?.city || 'Dhaka';
    let organizerId: string | null = null;

    if (purpose === 'MATCH_FEE') {
      if (!session || !userRecord) {
        return fail('UNAUTHORIZED', 'Please sign in before paying for a match slot', 401);
      }
      if (!referenceId) {
        return fail('BAD_REQUEST', 'matchId is required for match fee payment', 400);
      }

      const match = await prisma.match.findUnique({
        where: { id: referenceId },
        include: {
          participants: { where: { status: 'CONFIRMED', leftAt: null }, select: { userId: true } },
        },
      });

      if (!match) {
        return fail('RESOURCE_NOT_FOUND', 'Match not found', 404);
      }
      if (!match.allowOnlinePayment) {
        return fail(
          'BAD_REQUEST',
          'Online payment is disabled for Quick Match Host fixtures. Pay turf and equipment fees directly at the venue.',
          400
        );
      }
      if (match.status === 'CANCELLED' || match.status === 'COMPLETED') {
        return fail('BAD_REQUEST', 'Cannot pay for a cancelled or completed match', 400);
      }
      const viewer = await getViewerEligibilityProfile(session);
      const eligibility = checkMatchEligibility(viewer, match);
      if (!eligibility.eligible) {
        return fail(
          'ELIGIBILITY_RESTRICTED',
          eligibility.reason || 'You do not meet this match’s age or gender requirements.',
          403
        );
      }
      if (match.participants.some((p) => p.userId === session.userId)) {
        return fail('CONFLICT', 'You have already joined this match', 409);
      }
      if (match.participants.length >= match.capacity) {
        return fail('BAD_REQUEST', 'This match is already full', 400);
      }

      amount = match.feeAmount + (match.equipmentFee || 0) > 0 ? match.feeAmount + (match.equipmentFee || 0) : amount;
      productName = `Match Fee: ${match.title}`;
      customerCity = match.city || customerCity;
      organizerId = match.organizerId;
    } else if (purpose === 'TOURNAMENT_FEE') {
      if (!referenceId) {
        return fail('BAD_REQUEST', 'registrationId is required for tournament entry fee', 400);
      }
      const reg = await prisma.tournamentRegistration.findUnique({
        where: { id: referenceId },
        include: { tournament: true },
      });
      if (!reg) {
        return fail('RESOURCE_NOT_FOUND', 'Team registration not found', 404);
      }
      amount = reg.tournament.entryFee > 0 ? reg.tournament.entryFee : amount;
      productName = `Tournament Fee: ${reg.tournament.title} (${reg.teamName})`;
      customerCity = reg.tournament.city || customerCity;
      organizerId = reg.tournament.organizerId;
    } else if (purpose === 'EVENT_TICKET') {
      const tournamentId = String((parsed.metadata as Record<string, unknown>)?.eventId || referenceId || '');
      if (!tournamentId) {
        return fail('BAD_REQUEST', 'eventId is required for spectator tickets', 400);
      }
      const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: { tickets: { where: { status: { not: 'CANCELLED' } }, select: { id: true } } },
      });
      if (!tournament) {
        return fail('RESOURCE_NOT_FOUND', 'Tournament not found', 404);
      }
      if (tournament.spectatorMode === 'NONE') {
        return fail('BAD_REQUEST', 'Spectator tickets are not available for this tournament', 400);
      }
      const meta = (parsed.metadata || {}) as Record<string, unknown>;
      const quantity = Math.max(1, Math.min(20, Number(meta.quantity) || 1));
      if (
        tournament.spectatorMode === 'LIMITED_TICKETS' &&
        tournament.tickets.length + quantity > tournament.spectatorCapacity
      ) {
        return fail('BAD_REQUEST', 'Not enough spectator seats remaining', 400);
      }
      const tierId = String(meta.tierId || 'general');
      const unitPrice =
        tierId === 'vip' && tournament.vipTicketPrice
          ? tournament.vipTicketPrice
          : tournament.ticketPrice;
      const pricing = await validateAndComputeCoupon({
        tournamentId: tournament.id,
        couponCode: meta.couponCode ? String(meta.couponCode) : null,
        userId: session?.userId ?? null,
        unitPrice,
        quantity,
      });
      amount = pricing.finalPrice;
      productName = `${tournament.title} (${quantity}x ${tierId === 'vip' ? 'VIP' : 'Spectator'} Ticket)`;
      customerCity = tournament.city || customerCity;
      organizerId = tournament.organizerId;
      parsed.metadata = {
        ...meta,
        tournamentId: tournament.id,
        quantity,
        unitPrice,
        discountAmount: pricing.discountAmount,
        tierName: tierId === 'vip' ? 'VIP Pass' : 'General Spectator',
      };
    }

    if (!amount || amount <= 0) {
      return fail('BAD_REQUEST', 'Payment amount must be greater than BDT 0', 400);
    }

    const customerName = parsed.customerName || userRecord?.fullName || 'Khela Hobe Player';
    const customerEmail = parsed.customerEmail || userRecord?.email || 'player@example.com';
    const customerPhone = parsed.customerPhone || userRecord?.phoneNumber || '+8801700000000';
    const currency = parsed.currency || 'BDT';

    const tranId = `KH_${Date.now()}_${randomBytes(3).toString('hex').toUpperCase()}`;
    const cfg = getSslcommerzConfig();

    const txRecord = await prisma.paymentTransaction.create({
      data: {
        tranId,
        amount,
        currency,
        purpose,
        referenceId,
        userId: session?.userId ?? null,
        organizerId,
        customerName,
        customerEmail,
        customerPhone,
        status: 'PENDING',
        metadata: (parsed.metadata ?? {}) as object,
      },
    });

    const gatewayRes = await initiateSslcommerzSession({
      tranId,
      amount,
      currency,
      productName,
      productCategory: parsed.productCategory || 'Sports',
      customerName,
      customerEmail,
      customerPhone,
      customerCity,
      successUrl: `${cfg.backendUrl}/api/v1/payments/sslcommerz/callback?outcome=success&tran_id=${encodeURIComponent(tranId)}`,
      failUrl: `${cfg.backendUrl}/api/v1/payments/sslcommerz/callback?outcome=fail&tran_id=${encodeURIComponent(tranId)}`,
      cancelUrl: `${cfg.backendUrl}/api/v1/payments/sslcommerz/callback?outcome=cancel&tran_id=${encodeURIComponent(tranId)}`,
      ipnUrl: `${cfg.backendUrl}/api/v1/payments/sslcommerz/ipn`,
    });

    if (gatewayRes.status !== 'SUCCESS' || !gatewayRes.GatewayPageURL) {
      await prisma.paymentTransaction.update({
        where: { id: txRecord.id },
        data: {
          status: 'FAILED',
          rawResponse: gatewayRes as object,
        },
      });
      return fail(
        'PAYMENT_INIT_FAILED',
        gatewayRes.failedreason || 'SSLCommerz failed to create payment session',
        502
      );
    }

    await prisma.paymentTransaction.update({
      where: { id: txRecord.id },
      data: {
        sessionKey: gatewayRes.sessionkey || null,
        gatewayUrl: gatewayRes.GatewayPageURL,
      },
    });

    return ok({
      tranId,
      gatewayUrl: gatewayRes.GatewayPageURL,
      sessionKey: gatewayRes.sessionkey || null,
      amount,
      currency,
      sandbox: cfg.isSandbox,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
