import { NextRequest } from 'next/server';
import { z } from 'zod';
import { NotificationType, SettlementStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok, toEpoch } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';
import { sendPreferenceAwareEmail } from '@/lib/emailDispatcher';
import { organizerSettlementEmailTemplate } from '@/lib/emailTemplates';

const updateSettlementSchema = z.object({
  status: z.enum(['PROCESSING', 'SETTLED', 'REJECTED']),
  platformFeeRate: z.number().min(0).max(0.5).optional(),
  referenceNo: z.string().trim().max(120).optional().nullable(),
  notes: z.string().trim().max(400).optional().nullable(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }
    if (!session.roles.includes('ADMIN')) {
      return fail('ACCESS_DENIED', 'Admin privileges required', 403);
    }

    const { id } = await context.params;
    const existing = await prisma.organizerSettlement.findUnique({
      where: { id },
      include: { organizer: { select: { id: true, fullName: true, email: true } } },
    });
    if (!existing) {
      return fail('RESOURCE_NOT_FOUND', 'Settlement record not found', 404);
    }

    const body = await request.json();
    const parsed = updateSettlementSchema.parse(body);

    const feeRate =
      parsed.platformFeeRate !== undefined ? parsed.platformFeeRate : existing.platformFeeRate;
    const platformFeeAmount = Number((existing.grossAmount * feeRate).toFixed(2));
    const netPayoutAmount = Number((existing.grossAmount - platformFeeAmount).toFixed(2));

    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.organizerSettlement.update({
        where: { id },
        data: {
          status: parsed.status as SettlementStatus,
          platformFeeRate: feeRate,
          platformFeeAmount,
          netPayoutAmount,
          ...(parsed.referenceNo !== undefined ? { referenceNo: parsed.referenceNo } : {}),
          ...(parsed.notes !== undefined ? { notes: parsed.notes } : {}),
          ...(parsed.status === 'SETTLED'
            ? { settledById: session.userId, settledAt: new Date() }
            : {}),
        },
      });

      if (parsed.status === 'REJECTED') {
        await tx.paymentTransaction.updateMany({
          where: { settlementId: id },
          data: { settlementId: null },
        });
      }

      return row;
    });

    if (parsed.status === 'SETTLED') {
      await prisma.notification.create({
        data: {
          userId: existing.organizerId,
          type: NotificationType.GENERAL,
          title: 'Organizer Earnings Settled!',
          message: `Payout of BDT ${netPayoutAmount.toFixed(2)} sent via ${updated.payoutMethod} (after ${Math.round(feeRate * 100)}% platform fee).`,
          link: '/organizer/earnings',
        },
      }).catch(() => {});

      const tpl = organizerSettlementEmailTemplate({
        organizerName: existing.organizer.fullName,
        grossAmount: existing.grossAmount,
        platformFeeRate: feeRate,
        platformFeeAmount,
        netPayoutAmount,
        payoutMethod: updated.payoutMethod,
        payoutAccount: updated.payoutAccount,
        referenceNo: updated.referenceNo,
      });
      await sendPreferenceAwareEmail({
        userId: existing.organizerId,
        preferenceKey: 'emailAccountSecurity',
        toEmail: existing.organizer.email,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
      });
    }

    await recordAuditLog({
      userId: session.userId,
      action:
        parsed.status === 'SETTLED'
          ? 'ORGANIZER_SETTLEMENT_PAID'
          : parsed.status === 'REJECTED'
            ? 'ORGANIZER_SETTLEMENT_REJECTED'
            : 'ORGANIZER_SETTLEMENT_UPDATED',
      entityType: 'ORGANIZER_SETTLEMENT',
      entityId: updated.id,
      notes: `Updated settlement ${updated.id} -> ${updated.status} (net BDT ${updated.netPayoutAmount}, fee BDT ${updated.platformFeeAmount})`,
      request,
    });

    return ok({
      id: updated.id,
      status: updated.status,
      grossAmount: updated.grossAmount,
      platformFeeRate: updated.platformFeeRate,
      platformFeeAmount: updated.platformFeeAmount,
      netPayoutAmount: updated.netPayoutAmount,
      referenceNo: updated.referenceNo,
      settledAt: toEpoch(updated.settledAt),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
