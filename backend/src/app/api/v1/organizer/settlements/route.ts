import { NextRequest } from 'next/server';
import { z } from 'zod';
import { NotificationType, SettlementStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok, toEpoch } from '@/lib/http';
import { isOrganizerVerifiedForCreation, verifySession } from '@/lib/auth';
import { buildOrganizerLedger, DEFAULT_PLATFORM_FEE_RATE } from '@/lib/settlements';
import { recordAuditLog } from '@/lib/audit';

const requestSettlementSchema = z.object({
  payoutMethod: z.enum(['BKASH', 'NAGAD', 'BANK_TRANSFER', 'MANUAL']).default('BKASH'),
  payoutAccount: z.string().trim().min(5, 'Enter your bKash/Nagad/Bank account details').max(150),
  notes: z.string().trim().max(400).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const orgCheck = await isOrganizerVerifiedForCreation(session.userId, session.roles);
    if (!orgCheck.allowed) {
      return fail('ACCESS_DENIED', orgCheck.message || 'Full Organizer privileges required', 403);
    }

    const { searchParams } = new URL(request.url);
    const targetOrgId =
      session.roles.includes('ADMIN') && searchParams.get('organizerId')
        ? String(searchParams.get('organizerId'))
        : session.userId;

    const ledger = await buildOrganizerLedger(targetOrgId);
    return ok(ledger);
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

    const orgCheck = await isOrganizerVerifiedForCreation(session.userId, session.roles);
    if (!orgCheck.allowed) {
      return fail('ACCESS_DENIED', orgCheck.message || 'Full Organizer privileges required', 403);
    }

    const body = await request.json();
    const parsed = requestSettlementSchema.parse(body);

    const ledger = await buildOrganizerLedger(session.userId, DEFAULT_PLATFORM_FEE_RATE);
    if (ledger.unsettledGross <= 0 || ledger.unsettledTransactionIds.length === 0) {
      return fail(
        'BAD_REQUEST',
        'No unsettled online earnings available to request payout right now.',
        400
      );
    }

    const grossAmount = ledger.unsettledGross;
    const platformFeeAmount = Number((grossAmount * DEFAULT_PLATFORM_FEE_RATE).toFixed(2));
    const netPayoutAmount = Number((grossAmount - platformFeeAmount).toFixed(2));

    const settlement = await prisma.$transaction(async (tx) => {
      const created = await tx.organizerSettlement.create({
        data: {
          organizerId: session.userId,
          grossAmount,
          platformFeeRate: DEFAULT_PLATFORM_FEE_RATE,
          platformFeeAmount,
          netPayoutAmount,
          payoutMethod: parsed.payoutMethod,
          payoutAccount: parsed.payoutAccount,
          notes: parsed.notes ?? null,
          status: SettlementStatus.PENDING,
          requestedById: session.userId,
        },
      });

      await tx.paymentTransaction.updateMany({
        where: {
          id: { in: ledger.unsettledTransactionIds },
          settlementId: null,
        },
        data: {
          settlementId: created.id,
          organizerId: session.userId,
        },
      });

      return created;
    });

    const admins = await prisma.userRoleAssignment.findMany({
      where: { role: 'ADMIN' },
      select: { userId: true },
    });
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((a) => ({
          userId: a.userId,
          type: NotificationType.GENERAL,
          title: 'Organizer Payout Request',
          message: `Settlement requested for BDT ${netPayoutAmount.toFixed(0)} net (Gross BDT ${grossAmount.toFixed(0)}, 10% platform fee BDT ${platformFeeAmount.toFixed(0)}).`,
          link: '/admin/settlements',
        })),
      });
    }

    await recordAuditLog({
      userId: session.userId,
      action: 'ORGANIZER_SETTLEMENT_REQUESTED',
      entityType: 'ORGANIZER_SETTLEMENT',
      entityId: settlement.id,
      notes: `Requested payout BDT ${netPayoutAmount} via ${parsed.payoutMethod} (${parsed.payoutAccount})`,
      request,
    });

    return ok(
      {
        id: settlement.id,
        grossAmount: settlement.grossAmount,
        platformFeeRate: settlement.platformFeeRate,
        platformFeeAmount: settlement.platformFeeAmount,
        netPayoutAmount: settlement.netPayoutAmount,
        payoutMethod: settlement.payoutMethod,
        payoutAccount: settlement.payoutAccount,
        status: settlement.status,
        createdAt: toEpoch(settlement.createdAt),
      },
      201
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
