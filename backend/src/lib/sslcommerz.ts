import {
  MatchStatus,
  NotificationType,
  ParticipantStatus,
  Prisma,
  TicketStatus,
} from '@prisma/client';
import prisma from './prisma';
import { invalidateMatchesCache, invalidateTournamentsCache } from './cache';
import { computeTournamentExpiry, generateTicketCode } from './tickets';
import { sendPreferenceAwareEmail } from './emailDispatcher';
import {
  matchJoinConfirmedEmailTemplate,
  ticketBookingEmailTemplate,
  tournamentTeamUpdateEmailTemplate,
} from './emailTemplates';

export interface SslcommerzConfig {
  storeId: string;
  storePassword: string;
  isSandbox: boolean;
  baseUrl: string;
  frontendUrl: string;
  backendUrl: string;
}

export function getSslcommerzConfig(): SslcommerzConfig {
  const storeId = (process.env.SSLCOMMERZ_STORE_ID || '').trim();
  const storePassword = (process.env.SSLCOMMERZ_STORE_PASSWORD || '').trim();
  const isSandbox = (process.env.SSLCOMMERZ_IS_SANDBOX || 'true').toLowerCase() !== 'false';
  const baseUrl = isSandbox
    ? 'https://sandbox.sslcommerz.com'
    : 'https://securepay.sslcommerz.com';
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
  const backendUrl = (process.env.BACKEND_URL || 'http://localhost:8080').replace(/\/+$/, '');

  return {
    storeId,
    storePassword,
    isSandbox,
    baseUrl,
    frontendUrl,
    backendUrl,
  };
}

export function isSslcommerzConfigured(): boolean {
  const { storeId, storePassword } = getSslcommerzConfig();
  return Boolean(storeId && storePassword);
}

export interface SslcommerzInitResponse {
  status: string;
  failedreason?: string;
  sessionkey?: string;
  GatewayPageURL?: string;
  redirectGatewayURL?: string;
}

export async function initiateSslcommerzSession(params: {
  tranId: string;
  amount: number;
  currency?: string;
  productName: string;
  productCategory?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCity?: string;
  successUrl: string;
  failUrl: string;
  cancelUrl: string;
  ipnUrl: string;
}): Promise<SslcommerzInitResponse> {
  const cfg = getSslcommerzConfig();
  if (!cfg.storeId || !cfg.storePassword) {
    throw new Error(
      'SSLCommerz sandbox credentials are not configured. Set SSLCOMMERZ_STORE_ID and SSLCOMMERZ_STORE_PASSWORD in backend/.env.'
    );
  }

  const form = new URLSearchParams({
    store_id: cfg.storeId,
    store_passwd: cfg.storePassword,
    total_amount: params.amount.toFixed(2),
    currency: params.currency || 'BDT',
    tran_id: params.tranId,
    success_url: params.successUrl,
    fail_url: params.failUrl,
    cancel_url: params.cancelUrl,
    ipn_url: params.ipnUrl,
    shipping_method: 'NO',
    product_name: params.productName.slice(0, 250),
    product_category: params.productCategory || 'Sports',
    product_profile: 'general',
    cus_name: params.customerName.slice(0, 50) || 'Player',
    cus_email: params.customerEmail.slice(0, 50) || 'player@example.com',
    cus_add1: params.customerCity || 'Dhaka',
    cus_city: params.customerCity || 'Dhaka',
    cus_country: 'Bangladesh',
    cus_phone: params.customerPhone.slice(0, 20) || '+8801700000000',
  });

  const res = await fetch(`${cfg.baseUrl}/gwprocess/v4/api.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });

  if (!res.ok) {
    throw new Error(`SSLCommerz gateway returned HTTP ${res.status}`);
  }

  return (await res.json()) as SslcommerzInitResponse;
}

export interface SslcommerzValidationResponse {
  status: string;
  tran_id?: string;
  val_id?: string;
  amount?: string;
  store_amount?: string;
  currency?: string;
  bank_tran_id?: string;
  card_type?: string;
  card_issuer?: string;
  error?: string;
}

export async function validateSslcommerzTransaction(
  valId: string
): Promise<SslcommerzValidationResponse> {
  const cfg = getSslcommerzConfig();
  if (!cfg.storeId || !cfg.storePassword) {
    throw new Error('SSLCommerz credentials are missing on server');
  }

  const url = new URL(`${cfg.baseUrl}/validator/api/validationserverAPI.php`);
  url.searchParams.set('val_id', valId);
  url.searchParams.set('store_id', cfg.storeId);
  url.searchParams.set('store_passwd', cfg.storePassword);
  url.searchParams.set('v', '1');
  url.searchParams.set('format', 'json');

  const res = await fetch(url.toString(), { method: 'GET' });
  if (!res.ok) {
    throw new Error(`SSLCommerz validation API returned HTTP ${res.status}`);
  }

  return (await res.json()) as SslcommerzValidationResponse;
}

export async function confirmMatchParticipationAfterPayment(txRecord: {
  id: string;
  tranId?: string;
  purpose: string;
  referenceId: string | null;
  userId: string | null;
  amount: number;
  currency: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  metadata?: unknown;
}) {
  if (txRecord.purpose === 'MATCH_FEE' && txRecord.referenceId && txRecord.userId) {
    const matchId = txRecord.referenceId;
    const userId = txRecord.userId;

    await prisma.$transaction(async (tx) => {
      const match = await tx.match.findUnique({
        where: { id: matchId },
        include: {
          participants: {
            where: { status: ParticipantStatus.CONFIRMED, leftAt: null },
            select: { userId: true },
          },
        },
      });

      if (!match) return;
      if (match.status === MatchStatus.CANCELLED || match.status === MatchStatus.COMPLETED) return;
      if (match.joinMode === 'APPLICATION_REQUIRED' || match.joinMode === 'APPROVAL_REQUIRED') return;

      const alreadyJoined = match.participants.some((p) => p.userId === userId);
      if (alreadyJoined) return;
      if (match.participants.length >= match.capacity) return;

      await tx.matchParticipant.create({
        data: {
          matchId,
          userId,
          status: ParticipantStatus.CONFIRMED,
        },
      });

      if (match.participants.length + 1 >= match.capacity && match.status === MatchStatus.OPEN) {
        await tx.match.update({
          where: { id: matchId },
          data: { status: MatchStatus.FULL },
        });
      }

      await tx.notification.create({
        data: {
          userId,
          type: NotificationType.MATCH_JOIN_CONFIRMED,
          title: 'Payment & Match Spot Confirmed',
          message: `Your payment of ${txRecord.currency} ${txRecord.amount.toFixed(0)} was verified and your spot in "${match.title}" is confirmed.`,
          link: `/matches/${matchId}`,
        },
      });
    });

    await invalidateMatchesCache(matchId);

    const matchDetails = await prisma.match.findUnique({
      where: { id: matchId },
      include: { sport: { select: { name: true } } },
    });
    const playerUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true, email: true },
    });
    if (matchDetails && playerUser?.email) {
      const cfg = getSslcommerzConfig();
      const tpl = matchJoinConfirmedEmailTemplate({
        recipientName: playerUser.fullName,
        matchTitle: matchDetails.title,
        sport: matchDetails.sport?.name || 'Sports',
        venue: `${matchDetails.locationName || matchDetails.locationAddress || 'Confirmed Venue'}, ${matchDetails.area || matchDetails.city}`,
        schedule: matchDetails.startTime.toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' }),
        feeText: `${txRecord.currency} ${txRecord.amount.toFixed(0)} Paid Online`,
        matchUrl: `${cfg.frontendUrl}/matches/${matchId}`,
      });
      await sendPreferenceAwareEmail({
        userId,
        preferenceKey: 'emailMatchJoin',
        toEmail: playerUser.email,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
      });
    }
    return;
  }

  if (txRecord.purpose === 'TOURNAMENT_FEE' && txRecord.referenceId) {
    const registration = await prisma.tournamentRegistration.findUnique({
      where: { id: txRecord.referenceId },
      include: { tournament: true },
    });
    if (!registration) return;

    const nextStatus = registration.tournament.requireTeamApproval ? 'PENDING' : 'CONFIRMED';
    await prisma.tournamentRegistration.update({
      where: { id: registration.id },
      data: {
        paymentStatus: 'PAID',
        status: registration.status === 'PENDING_PAYMENT' ? nextStatus : registration.status,
        tranId: txRecord.tranId || registration.tranId,
      },
    });

    if (registration.userId) {
      await prisma.notification.create({
        data: {
          userId: registration.userId,
          type: NotificationType.GENERAL,
          title: 'Tournament Entry Fee Verified',
          message: `Payment of BDT ${txRecord.amount.toFixed(0)} verified for team "${registration.teamName}" in "${registration.tournament.title}".`,
          link: `/events/${registration.tournamentId}`,
        },
      });
      const cfg = getSslcommerzConfig();
      const tpl = tournamentTeamUpdateEmailTemplate({
        recipientName: registration.captainName,
        tournamentTitle: registration.tournament.title,
        teamName: registration.teamName,
        statusLabel: nextStatus === 'CONFIRMED' ? 'Confirmed' : 'Pending Organizer Review',
        paymentText: `BDT ${txRecord.amount.toFixed(0)} Paid Online`,
        eventUrl: `${cfg.frontendUrl}/events/${registration.tournamentId}`,
      });
      await sendPreferenceAwareEmail({
        userId: registration.userId,
        preferenceKey: 'emailMatchJoin',
        toEmail: registration.contactEmail || txRecord.customerEmail,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
      });
    }
    await invalidateTournamentsCache();
    return;
  }

  if (txRecord.purpose === 'EVENT_TICKET' && txRecord.referenceId) {
    const meta = (txRecord.metadata || {}) as Record<string, unknown>;
    const tournamentId = String(meta.tournamentId || txRecord.referenceId);
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) return;

    const existingForTran = txRecord.tranId
      ? await prisma.ticket.count({ where: { tranId: txRecord.tranId } })
      : 0;
    if (existingForTran > 0) return;

    const quantity = Math.max(1, Math.min(20, Number(meta.quantity) || 1));
    const unitPrice = Number(meta.unitPrice) || Number((txRecord.amount / quantity).toFixed(2));
    const totalDiscount = Number(meta.discountAmount) || 0;
    const perTicketDiscount = Number((totalDiscount / quantity).toFixed(2));
    const perTicketFinal = Math.max(0, Number((txRecord.amount / quantity).toFixed(2)));
    const tierName = String(meta.tierName || 'General Spectator');
    const couponCode = meta.couponCode ? String(meta.couponCode).toUpperCase() : null;
    const attendeeName = String(meta.attendeeName || txRecord.customerName || 'Spectator');
    const attendeePhone = String(meta.attendeePhone || txRecord.customerPhone || '');
    const attendeeEmail = meta.attendeeEmail
      ? String(meta.attendeeEmail)
      : txRecord.customerEmail || null;
    const expiresAt = computeTournamentExpiry(tournament.startDate);

    const rows = Array.from({ length: quantity }).map(() => {
      const code = generateTicketCode();
      return {
        ticketCode: code,
        tournamentId: tournament.id,
        userId: txRecord.userId ?? null,
        tierName,
        unitPrice,
        discountAmount: perTicketDiscount,
        finalPrice: perTicketFinal,
        couponCode,
        paymentMethod: 'SSLCOMMERZ',
        paymentStatus: 'PAID',
        tranId: txRecord.tranId ?? null,
        attendeeName,
        attendeePhone,
        attendeeEmail,
        status: TicketStatus.PAID,
        qrPayload: JSON.stringify({ code, tournamentId: tournament.id, tierName }),
        expiresAt,
      };
    });

    await prisma.ticket.createMany({ data: rows });

    if (couponCode) {
      await prisma.ticketCoupon.updateMany({
        where: { tournamentId: tournament.id, code: couponCode },
        data: { usedCount: { increment: 1 } },
      });
    }

    if (txRecord.userId) {
      await prisma.notification.create({
        data: {
          userId: txRecord.userId,
          type: NotificationType.GENERAL,
          title: 'Spectator Tickets Issued!',
          message: `${quantity} ticket${quantity > 1 ? 's' : ''} issued for "${tournament.title}" (BDT ${txRecord.amount.toFixed(0)} paid).`,
          link: '/player/tickets',
        },
      });
    }
    const cfg = getSslcommerzConfig();
    const tpl = ticketBookingEmailTemplate({
      recipientName: attendeeName,
      eventTitle: tournament.title,
      tierName,
      ticketCodes: rows.map((r) => r.ticketCode),
      quantity,
      totalAmount: txRecord.amount,
      discountAmount: totalDiscount,
      paymentStatus: 'Paid Online (SSLCommerz)',
      venue: `${tournament.venueName}, ${tournament.area || tournament.city}`,
      schedule: `${tournament.startDate} • ${tournament.time}`,
      ticketsUrl: `${cfg.frontendUrl}/player/tickets`,
    });
    await sendPreferenceAwareEmail({
      userId: txRecord.userId,
      preferenceKey: 'emailTicketUpdates',
      toEmail: attendeeEmail,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
    });
    await invalidateTournamentsCache();
  }
}

export function extractCallbackParams(
  searchParams: URLSearchParams,
  bodyParams: Record<string, string>
) {
  return {
    outcome: (searchParams.get('outcome') || '').toLowerCase(),
    tranId: bodyParams.tran_id || searchParams.get('tran_id') || '',
    valId: bodyParams.val_id || searchParams.get('val_id') || '',
    status: (bodyParams.status || searchParams.get('status') || '').toUpperCase(),
    bankTranId: bodyParams.bank_tran_id || searchParams.get('bank_tran_id') || null,
    cardType: bodyParams.card_type || searchParams.get('card_type') || null,
    cardIssuer: bodyParams.card_issuer || searchParams.get('card_issuer') || null,
    storeAmount: bodyParams.store_amount ? Number(bodyParams.store_amount) : null,
    rawPayload: bodyParams as Prisma.InputJsonValue,
  };
}
