import { NextRequest } from 'next/server';
import { z } from 'zod';
import { TicketStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { invalidateTournamentsCache } from '@/lib/cache';

const cancelSchema = z.object({
  reason: z.string().trim().max(300).optional(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession(request);
    if (!session) return fail('UNAUTHORIZED', 'Authentication required', 401);

    const { id } = await context.params;
    const ticket = await prisma.ticket.findFirst({
      where: {
        OR: [{ id }, { ticketCode: id }],
      },
    });

    if (!ticket) {
      return fail('RESOURCE_NOT_FOUND', 'Ticket not found', 404);
    }
    if (ticket.userId !== session.userId && !session.roles.includes('ADMIN')) {
      return fail('ACCESS_DENIED', 'You can only cancel your own tickets', 403);
    }
    if (ticket.status === TicketStatus.USED) {
      return fail('BAD_REQUEST', 'Used tickets cannot be cancelled', 400);
    }

    const body = await request.json().catch(() => ({}));
    const parsed = cancelSchema.parse(body);

    const updated = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: TicketStatus.CANCELLED,
        cancelReason: parsed.reason || 'Cancelled by attendee',
      },
    });

    await invalidateTournamentsCache();
    return ok({ id: updated.ticketCode, status: 'Cancelled' });
  } catch (error) {
    return handleRouteError(error);
  }
}
