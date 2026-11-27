import { NextRequest } from 'next/server';
import { z } from 'zod';
import { NotificationType, SettlementStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok, toEpoch } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { buildOrganizerLedger, DEFAULT_PLATFORM_FEE_RATE } from '@/lib/settlements';
import { recordAuditLog } from '@/lib/audit';
import { sendPreferenceAwareEmail } from '@/lib/emailDispatcher';
import { organizerSettlementEmailTemplate } from '@/lib/emailTemplates';

const directSettleSchema = z.object({
  organizerId: z.string().trim().min(1),
  platformFeeRate: z.number().min(0).max(0.5).optional().default(DEFAULT_PLATFORM_FEE_RATE),
  payoutMethod: z.enum(['BKASH', 'NAGAD', 'BANK_TRANSFER', 'MANUAL']).default('BKASH'),
  payoutAccount: z.string().trim().min(3).max(150),
  referenceNo: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(400).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }
    if (!session.roles.includes('ADMIN')) {
      return fail('ACCESS_DENIED', 'Admin privileges required', 403);
    }

    const [organizers, settlements] = await Promise.all([
      prisma.user.findMany({
        where: {
          roles: { some: { role: 'ORGANIZER' } },
          organizerApprovalStatus: 'APPROVED',
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          phoneNumber: true,
        },
      }),
      prisma.organizerSettlement.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          organizer: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
        },
      }),
    ]);

    const organizerBalances = await Promise.all(
      organizers.map(async (org) => {
        const ledger = await buildOrganizerLedger(org.id, DEFAULT_PLATFORM_FEE_RATE);
        return {
          organizerId: org.id,
          name: org.fullName,
          email: org.email,
          phoneNumber: org.phoneNumber,
          grossEarned: ledger.grossEarned,
          unsettledGross: ledger.unsettledGross,
          estimatedPlatformFee: ledger.estimatedPlatformFee,
          availableNetPayout: ledger.availableNetPayout,
          settledNetTotal: ledger.settledNetTotal,
          unsettledCount: ledger.unsettledCount,
        };
      })
    );

    const totals = {
      totalPlatformFeesCollected: settlements
        .filter((s) => s.status === 'SETTLED')
        .reduce((s, r) => s + r.platformFeeAmount, 0),
      totalNetSettledToOrganizers: settlements
        .filter((s) => s.status === 'SETTLED')
        .reduce((s, r) => s + r.netPayoutAmount, 0),
      totalUnsettledGross: organizerBalances.reduce((s, b) => s + b.unsettledGross, 0),
      pendingRequestsCount: settlements.filter(
        (s) => s.status === 'PENDING' || s.status === 'PROCESSING'
      ).length,
    };

    return ok({
      defaultPlatformFeePercent: Math.round(DEFAULT_PLATFORM_FEE_RATE * 100),
      totals,
      organizerBalances,
      settlements: settlements.map((s) => ({
        id: s.id,
        organizerId: s.organizerId,
        organizerName: s.organizer?.fullName || 'Organizer',
        organizerEmail: s.organizer?.email || '',
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
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }
    if (!session.roles.includes('ADMIN')) {
      return fail('ACCESS_DENIED', 'Admin privileges required', 403);
    }

    const body = await request.json();
    const parsed = directSettleSchema.parse(body);

    const organizer = await prisma.user.findUnique({
      where: { id: parsed.organizerId },
      select: { id: true, fullName: true, email: true },
    });
    if (!organizer) {
      return fail('RESOURCE_NOT_FOUND', 'Organizer not found', 404);
    }

    const ledger = await buildOrganizerLedger(parsed.organizerId, parsed.platformFeeRate);
    if (ledger.unsettledGross <= 0 || ledger.unsettledTransactionIds.length === 0) {
      return fail('BAD_REQUEST', 'No unsettled online earnings available for this organizer.', 400);
    }

    const grossAmount = ledger.unsettledGross;
    const platformFeeAmount = Number((grossAmount * parsed.platformFeeRate).toFixed(2));
    const netPayoutAmount = Number((grossAmount - platformFeeAmount).toFixed(2));

    const settlement = await prisma.$transaction(async (tx) => {
      const created = await tx.organizerSettlement.create({
        data: {
          organizerId: parsed.organizerId,
          grossAmount,
          platformFeeRate: parsed.platformFeeRate,
          platformFeeAmount,
          netPayoutAmount,
          payoutMethod: parsed.payoutMethod,
          payoutAccount: parsed.payoutAccount,
          referenceNo: parsed.referenceNo ?? `SET-${Date.now().toString().slice(-6)}`,
          notes: parsed.notes ?? null,
          status: SettlementStatus.SETTLED,
          requestedById: session.userId,
          settledById: session.userId,
          settledAt: new Date(),
        },
      });

      await tx.paymentTransaction.updateMany({
        where: {
          id: { in: ledger.unsettledTransactionIds },
          settlementId: null,
        },
        data: {
          settlementId: created.id,
          organizerId: parsed.organizerId,
        },
      });

      return created;
    });

    await prisma.notification.create({
      data: {
        userId: parsed.organizerId,
        type: NotificationType.GENERAL,
        title: 'Organizer Earnings Settled!',
        message: `BDT ${netPayoutAmount.toFixed(2)} settled via ${parsed.payoutMethod} (Gross BDT ${grossAmount.toFixed(2)} minus ${Math.round(parsed.platformFeeRate * 100)}% fee BDT ${platformFeeAmount.toFixed(2)}).`,
        link: '/organizer/earnings',
      },
    }).catch(() => {});

    const tpl = organizerSettlementEmailTemplate({
      organizerName: organizer.fullName,
      grossAmount,
      platformFeeRate: parsed.platformFeeRate,
      platformFeeAmount,
      netPayoutAmount,
      payoutMethod: parsed.payoutMethod,
      payoutAccount: parsed.payoutAccount,
      referenceNo: settlement.referenceNo,
    });
    await sendPreferenceAwareEmail({
      userId: organizer.id,
      preferenceKey: 'emailAccountSecurity',
      toEmail: organizer.email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
    });

    await recordAuditLog({
      userId: session.userId,
      action: 'ORGANIZER_SETTLEMENT_PAID',
      entityType: 'ORGANIZER_SETTLEMENT',
      entityId: settlement.id,
      notes: `Admin directly settled BDT ${netPayoutAmount} to ${organizer.email} (fee: BDT ${platformFeeAmount})`,
      request,
    });

    return ok({
      id: settlement.id,
      grossAmount,
      platformFeeRate: settlement.platformFeeRate,
      platformFeeAmount,
      netPayoutAmount,
      status: settlement.status,
      referenceNo: settlement.referenceNo,
      settledAt: toEpoch(settlement.settledAt),
    }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
