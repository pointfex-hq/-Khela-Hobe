import prisma from '@/lib/prisma';
import { toEpoch } from '@/lib/http';

export const DEFAULT_PLATFORM_FEE_RATE = 0.10; // 10% platform commission

/**
 * Resolves all VALIDATED online payment transactions attributable to an organizer
 * (both explicitly tagged organizerId and legacy rows via Match / Registration / Tournament).
 */
export async function getOrganizerValidatedTransactions(organizerId: string) {
  const [orgMatches, orgTournaments] = await Promise.all([
    prisma.match.findMany({
      where: { organizerId },
      select: { id: true, title: true },
    }),
    prisma.tournament.findMany({
      where: { organizerId },
      select: {
        id: true,
        title: true,
        registrations: { select: { id: true } },
      },
    }),
  ]);

  const matchIds = orgMatches.map((m) => m.id);
  const tournamentIds = orgTournaments.map((t) => t.id);
  const regIds = orgTournaments.flatMap((t) => t.registrations.map((r) => r.id));

  const orClauses: Array<Record<string, unknown>> = [{ organizerId }];
  if (matchIds.length > 0) {
    orClauses.push({ purpose: 'MATCH_FEE', referenceId: { in: matchIds } });
  }
  if (regIds.length > 0) {
    orClauses.push({ purpose: 'TOURNAMENT_FEE', referenceId: { in: regIds } });
  }
  if (tournamentIds.length > 0) {
    orClauses.push({ purpose: 'EVENT_TICKET', referenceId: { in: tournamentIds } });
  }

  return prisma.paymentTransaction.findMany({
    where: {
      status: 'VALIDATED',
      OR: orClauses,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function buildOrganizerLedger(organizerId: string, feeRate = DEFAULT_PLATFORM_FEE_RATE) {
  const [transactions, settlements] = await Promise.all([
    getOrganizerValidatedTransactions(organizerId),
    prisma.organizerSettlement.findMany({
      where: { organizerId },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const cleanFeeRate = Math.min(0.5, Math.max(0, Number(feeRate) || DEFAULT_PLATFORM_FEE_RATE));

  const grossEarned = transactions.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const unsettledTxs = transactions.filter((tx) => !tx.settlementId);
  const unsettledGross = unsettledTxs.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const estimatedPlatformFee = Number((unsettledGross * cleanFeeRate).toFixed(2));
  const availableNetPayout = Number((unsettledGross - estimatedPlatformFee).toFixed(2));

  const settledRows = settlements.filter((s) => s.status === 'SETTLED');
  const pendingRows = settlements.filter(
    (s) => s.status === 'PENDING' || s.status === 'PROCESSING'
  );

  const settledGrossTotal = settledRows.reduce((s, r) => s + r.grossAmount, 0);
  const settledFeeTotal = settledRows.reduce((s, r) => s + r.platformFeeAmount, 0);
  const settledNetTotal = settledRows.reduce((s, r) => s + r.netPayoutAmount, 0);
  const pendingGrossTotal = pendingRows.reduce((s, r) => s + r.grossAmount, 0);
  const pendingNetTotal = pendingRows.reduce((s, r) => s + r.netPayoutAmount, 0);

  return {
    platformFeeRate: cleanFeeRate,
    platformFeePercent: Math.round(cleanFeeRate * 100),
    grossEarned: Number(grossEarned.toFixed(2)),
    unsettledGross: Number(unsettledGross.toFixed(2)),
    unsettledTransactionIds: unsettledTxs.map((t) => t.id),
    unsettledCount: unsettledTxs.length,
    estimatedPlatformFee,
    availableNetPayout,
    settledGrossTotal: Number(settledGrossTotal.toFixed(2)),
    settledFeeTotal: Number(settledFeeTotal.toFixed(2)),
    settledNetTotal: Number(settledNetTotal.toFixed(2)),
    pendingGrossTotal: Number(pendingGrossTotal.toFixed(2)),
    pendingNetTotal: Number(pendingNetTotal.toFixed(2)),
    transactions: transactions.slice(0, 50).map((t) => ({
      id: t.id,
      tranId: t.tranId,
      purpose: t.purpose,
      amount: t.amount,
      currency: t.currency,
      customerName: t.customerName,
      cardType: t.cardType,
      settlementId: t.settlementId,
      paidAt: toEpoch(t.paidAt || t.createdAt),
    })),
    settlements: settlements.map((s) => ({
      id: s.id,
      organizerId: s.organizerId,
      grossAmount: s.grossAmount,
      platformFeeRate: s.platformFeeRate,
      platformFeePercent: Math.round(s.platformFeeRate * 100),
      platformFeeAmount: s.platformFeeAmount,
      netPayoutAmount: s.netPayoutAmount,
      payoutMethod: s.payoutMethod,
      payoutAccount: s.payoutAccount,
      referenceNo: s.referenceNo,
      notes: s.notes,
      status: s.status,
      settledAt: toEpoch(s.settledAt),
      createdAt: toEpoch(s.createdAt),
    })),
  };
}
