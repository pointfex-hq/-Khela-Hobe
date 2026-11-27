import { NextRequest } from 'next/server';
import { z } from 'zod';
import { NotificationType } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { invalidateMatchesCache } from '@/lib/cache';

const pledgeSchema = z.object({
  quantity: z.number().int().min(1).max(100).optional().default(1),
});

async function recalcAndReturn(requirementId: string, userId: string) {
  const contributions = await prisma.equipmentContribution.findMany({
    where: { requirementId },
    include: { user: { select: { id: true, fullName: true, profileImageUrl: true } } },
  });
  const totalCommitted = contributions.reduce((sum, c) => sum + c.quantity, 0);
  const updatedReq = await prisma.equipmentRequirement.update({
    where: { id: requirementId },
    data: { committedQuantity: totalCommitted },
  });
  const mine = contributions.find((c) => c.userId === userId);
  return {
    id: updatedReq.id,
    name: updatedReq.equipmentName,
    required: updatedReq.requiredQuantity,
    committed: totalCommitted,
    remaining: Math.max(0, updatedReq.requiredQuantity - totalCommitted),
    userPledged: Boolean(mine),
    userCommittedQty: mine?.quantity || 0,
    contributors: contributions.map((c) => ({
      id: c.id,
      userId: c.userId,
      name: c.user?.fullName || 'Player',
      avatar: c.user?.profileImageUrl ?? null,
      quantity: c.quantity,
    })),
  };
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const session = await verifySession(request);
    if (!session) return fail('UNAUTHORIZED', 'Please sign in to contribute gear', 401);

    const { id: matchId, itemId } = await context.params;
    const reqItem = await prisma.equipmentRequirement.findUnique({
      where: { id: itemId },
      include: {
        match: { select: { id: true, title: true, organizerId: true, status: true } },
        contributions: true,
      },
    });

    if (!reqItem || reqItem.matchId !== matchId) {
      return fail('RESOURCE_NOT_FOUND', 'Equipment requirement not found', 404);
    }
    if (reqItem.match.status === 'CANCELLED' || reqItem.match.status === 'COMPLETED') {
      return fail('BAD_REQUEST', 'Cannot contribute equipment to a cancelled or completed match', 400);
    }

    const body = await request.json().catch(() => ({}));
    const parsed = pledgeSchema.parse(body);

    const otherCommitted = reqItem.contributions
      .filter((c) => c.userId !== session.userId)
      .reduce((sum, c) => sum + c.quantity, 0);
    const maxForUser = Math.max(0, reqItem.requiredQuantity - otherCommitted);

    if (maxForUser <= 0) {
      return fail('BAD_REQUEST', 'This equipment requirement is already 100% fulfilled.', 400);
    }
    if (parsed.quantity > maxForUser) {
      return fail(
        'BAD_REQUEST',
        `Only ${maxForUser} item(s) remaining for ${reqItem.equipmentName}.`,
        400
      );
    }

    await prisma.equipmentContribution.upsert({
      where: {
        requirementId_userId: {
          requirementId: itemId,
          userId: session.userId,
        },
      },
      update: { quantity: parsed.quantity },
      create: {
        requirementId: itemId,
        userId: session.userId,
        quantity: parsed.quantity,
      },
    });

    const result = await recalcAndReturn(itemId, session.userId);

    if (reqItem.match.organizerId !== session.userId) {
      const contributor = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { fullName: true },
      });
      await prisma.notification.create({
        data: {
          userId: reqItem.match.organizerId,
          type: NotificationType.MATCH_UPDATED,
          title: 'Equipment Contribution Logged',
          message: `${contributor?.fullName || 'A player'} pledged ${parsed.quantity}x ${reqItem.equipmentName} for "${reqItem.match.title}".`,
          link: `/organizer/matches/${matchId}`,
        },
      });
    }

    await invalidateMatchesCache(matchId);
    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const session = await verifySession(request);
    if (!session) return fail('UNAUTHORIZED', 'Authentication required', 401);

    const { id: matchId, itemId } = await context.params;
    const reqItem = await prisma.equipmentRequirement.findUnique({ where: { id: itemId } });
    if (!reqItem || reqItem.matchId !== matchId) {
      return fail('RESOURCE_NOT_FOUND', 'Equipment requirement not found', 404);
    }

    await prisma.equipmentContribution.deleteMany({
      where: { requirementId: itemId, userId: session.userId },
    });

    const result = await recalcAndReturn(itemId, session.userId);
    await invalidateMatchesCache(matchId);
    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
