import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok, toEpoch } from '@/lib/http';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      select: { id: true, teamSize: true },
    });

    if (!tournament) {
      return fail('RESOURCE_NOT_FOUND', 'Tournament not found', 404);
    }

    const registrations = await prisma.tournamentRegistration.findMany({
      where: {
        tournamentId: id,
        status: { not: 'PENDING_PAYMENT' },
      },
      orderBy: { createdAt: 'desc' },
    });

    return ok(
      registrations.map((r) => ({
        id: r.id,
        tournamentId: r.tournamentId,
        userId: r.userId,
        name: r.teamName,
        teamName: r.teamName,
        captain: r.captainName,
        captainName: r.captainName,
        phone: r.contactPhone,
        contactEmail: r.contactEmail,
        membersJson: Array.isArray(r.membersJson) ? r.membersJson : [],
        notes: r.notes,
        paymentStatus: r.paymentStatus,
        members:
          Array.isArray(r.membersJson) && r.membersJson.length > 0
            ? r.membersJson.length
            : tournament.teamSize,
        status: r.status,
        createdAt: toEpoch(r.createdAt),
      }))
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
