import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { invalidateMatchesCache } from '@/lib/cache';

const addEquipSchema = z.object({
  name: z.string().trim().min(1).max(120),
  requiredQuantity: z.number().int().min(1).max(100).default(1),
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession(request);
    const { id } = await context.params;
    const reqs = await prisma.equipmentRequirement.findMany({
      where: { matchId: id },
      orderBy: { createdAt: 'asc' },
      include: {
        contributions: {
          include: { user: { select: { id: true, fullName: true, profileImageUrl: true } } },
        },
      },
    });

    return ok(
      reqs.map((eq) => {
        const committed = eq.contributions.reduce((s, c) => s + c.quantity, 0);
        const mine = session ? eq.contributions.find((c) => c.userId === session.userId) : null;
        return {
          id: eq.id,
          name: eq.equipmentName,
          required: eq.requiredQuantity,
          committed,
          remaining: Math.max(0, eq.requiredQuantity - committed),
          userPledged: Boolean(mine),
          userCommittedQty: mine?.quantity || 0,
          contributors: eq.contributions.map((c) => ({
            id: c.id,
            userId: c.userId,
            name: c.user?.fullName || 'Player',
            avatar: c.user?.profileImageUrl ?? null,
            quantity: c.quantity,
          })),
        };
      })
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession(request);
    if (!session) return fail('UNAUTHORIZED', 'Authentication required', 401);

    const { id } = await context.params;
    const match = await prisma.match.findUnique({ where: { id } });
    if (!match) return fail('RESOURCE_NOT_FOUND', 'Match not found', 404);

    if (match.organizerId !== session.userId && !session.roles.includes('ADMIN')) {
      return fail('ACCESS_DENIED', 'Only the match organizer can add equipment requirements', 403);
    }

    const body = await request.json();
    const parsed = addEquipSchema.parse(body);

    const created = await prisma.equipmentRequirement.create({
      data: {
        matchId: id,
        equipmentName: parsed.name,
        requiredQuantity: parsed.requiredQuantity,
        committedQuantity: 0,
      },
    });

    await invalidateMatchesCache(id);
    return ok(
      {
        id: created.id,
        name: created.equipmentName,
        required: created.requiredQuantity,
        committed: 0,
        remaining: created.requiredQuantity,
        userPledged: false,
        userCommittedQty: 0,
        contributors: [],
      },
      201
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
