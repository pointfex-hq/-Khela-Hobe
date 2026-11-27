import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import { verifySession } from '@/lib/auth';

const createEquipmentSchema = z.object({
  name: z.string().trim().min(2).max(120),
  category: z.string().trim().max(80).optional(),
  description: z.string().trim().max(500).optional(),
  quantity: z.number().int().min(1).max(1000).optional(),
  sportId: z.string().optional(),
});

export async function GET() {
  try {
    const items = await prisma.equipmentItem.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return ok(items);
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

    const body = await request.json();
    const parsed = createEquipmentSchema.parse(body);

    const item = await prisma.equipmentItem.create({
      data: {
        name: parsed.name,
        category: parsed.category ?? null,
        description: parsed.description ?? null,
        quantity: parsed.quantity ?? 1,
        sportId: parsed.sportId ?? null,
        ownerId: session.userId,
      },
    });

    return ok(item, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
