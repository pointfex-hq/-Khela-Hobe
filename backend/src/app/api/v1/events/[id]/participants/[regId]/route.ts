import { NextRequest } from 'next/server';
import { z } from 'zod';
import { NotificationType } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { invalidateTournamentsCache } from '@/lib/cache';

const updateRegSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'REJECTED']).optional(),
  paymentStatus: z.enum(['FREE', 'PAID', 'PENDING_VENUE', 'UNPAID']).optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; regId: string }> }
) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { id: tournamentId, regId } = await context.params;
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) {
      return fail('RESOURCE_NOT_FOUND', 'Tournament not found', 404);
    }

    const isAdmin = session.roles.includes('ADMIN');
    if (tournament.organizerId !== session.userId && !isAdmin) {
      return fail('ACCESS_DENIED', 'Only the organizer can manage tournament teams', 403);
    }

    const reg = await prisma.tournamentRegistration.findUnique({ where: { id: regId } });
    if (!reg || reg.tournamentId !== tournamentId) {
      return fail('RESOURCE_NOT_FOUND', 'Team registration not found', 404);
    }

    const body = await request.json();
    const parsed = updateRegSchema.parse(body);

    const updated = await prisma.tournamentRegistration.update({
      where: { id: regId },
      data: {
        ...(parsed.status !== undefined ? { status: parsed.status } : {}),
        ...(parsed.paymentStatus !== undefined ? { paymentStatus: parsed.paymentStatus } : {}),
      },
    });

    if (parsed.status && reg.userId) {
      await prisma.notification.create({
        data: {
          userId: reg.userId,
          type: NotificationType.GENERAL,
          title:
            parsed.status === 'CONFIRMED'
              ? 'Tournament Team Approved!'
              : parsed.status === 'REJECTED'
                ? 'Tournament Team Update'
                : 'Tournament Team Status Updated',
          message:
            parsed.status === 'CONFIRMED'
              ? `Your team "${reg.teamName}" was approved for "${tournament.title}"!`
              : `Your team "${reg.teamName}" registration status in "${tournament.title}" is now ${parsed.status}.`,
          link: `/events/${tournamentId}`,
        },
      });
    }

    await invalidateTournamentsCache();
    return ok(updated);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; regId: string }> }
) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { id: tournamentId, regId } = await context.params;
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) {
      return fail('RESOURCE_NOT_FOUND', 'Tournament not found', 404);
    }

    const isAdmin = session.roles.includes('ADMIN');
    if (tournament.organizerId !== session.userId && !isAdmin) {
      return fail('ACCESS_DENIED', 'Only the organizer can remove teams', 403);
    }

    await prisma.tournamentRegistration.delete({ where: { id: regId } });
    await invalidateTournamentsCache();
    return ok({ deleted: true, id: regId });
  } catch (error) {
    return handleRouteError(error);
  }
}
