import { NextRequest } from 'next/server';
import { z } from 'zod';
import { NotificationType, TournamentStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { toTournamentDto } from '@/lib/mappers';
import { invalidateTournamentsCache } from '@/lib/cache';
import { recordAuditLog } from '@/lib/audit';

const standingSchema = z.object({
  id: z.string().optional(),
  teamName: z.string().trim().min(1).max(120),
  played: z.number().int().min(0).default(0),
  won: z.number().int().min(0).default(0),
  drawn: z.number().int().min(0).default(0),
  lost: z.number().int().min(0).default(0),
  goalsFor: z.number().int().min(0).default(0),
  goalsAgainst: z.number().int().min(0).default(0),
  points: z.number().int().min(0).default(0),
});

const fixtureSchema = z.object({
  id: z.string().optional(),
  round: z.string().trim().max(80).default('Matchday'),
  teamA: z.string().trim().min(1).max(120),
  teamB: z.string().trim().min(1).max(120),
  scoreA: z.number().int().min(0).nullable().optional(),
  scoreB: z.number().int().min(0).nullable().optional(),
  winner: z.string().trim().max(120).optional().nullable(),
  status: z.enum(['SCHEDULED', 'LIVE', 'FINAL']).default('FINAL'),
  notes: z.string().trim().max(300).optional().nullable(),
});

const resultsSchema = z.object({
  standings: z.array(standingSchema).max(64).optional(),
  fixtures: z.array(fixtureSchema).max(128).optional(),
  results: z
    .object({
      champion: z.string().trim().max(150).optional().nullable(),
      runnerUp: z.string().trim().max(150).optional().nullable(),
      thirdPlace: z.string().trim().max(150).optional().nullable(),
      mvp: z.string().trim().max(150).optional().nullable(),
      topScorer: z.string().trim().max(150).optional().nullable(),
      summary: z.string().trim().max(1500).optional().nullable(),
    })
    .optional(),
  markCompleted: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { id } = await context.params;
    const existing = await prisma.tournament.findUnique({
      where: { id },
      include: {
        registrations: {
          where: { status: 'CONFIRMED', userId: { not: null } },
          select: { userId: true },
        },
      },
    });
    if (!existing) {
      return fail('RESOURCE_NOT_FOUND', 'Tournament not found', 404);
    }

    const isAdmin = session.roles.includes('ADMIN');
    if (existing.organizerId !== session.userId && !isAdmin) {
      return fail(
        'ACCESS_DENIED',
        'Only the tournament organizer or an admin can publish results and leaderboards',
        403
      );
    }

    const body = await request.json();
    const parsed = resultsSchema.parse(body);

    const sortedStandings = parsed.standings
      ? [...parsed.standings]
          .sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            return b.goalsFor - b.goalsAgainst - (a.goalsFor - a.goalsAgainst);
          })
          .map((s, idx) => ({ ...s, id: s.id || `st-${idx + 1}`, rank: idx + 1 }))
      : undefined;

    const cleanFixtures = parsed.fixtures
      ? parsed.fixtures.map((f, idx) => ({ ...f, id: f.id || `fx-${idx + 1}` }))
      : undefined;

    const cleanResults = parsed.results
      ? {
          ...parsed.results,
          updatedAt: Date.now(),
        }
      : undefined;

    const updated = await prisma.tournament.update({
      where: { id },
      data: {
        ...(sortedStandings !== undefined ? { standingsJson: sortedStandings } : {}),
        ...(cleanFixtures !== undefined ? { fixturesJson: cleanFixtures } : {}),
        ...(cleanResults !== undefined ? { resultsJson: cleanResults } : {}),
        ...(parsed.markCompleted ? { status: TournamentStatus.COMPLETED } : {}),
      },
      include: {
        organizer: { select: { id: true, fullName: true, profileImageUrl: true } },
        registrations: { select: { id: true, status: true } },
        interests: { select: { userId: true } },
        tickets: { where: { status: { not: 'CANCELLED' } }, select: { id: true, status: true } },
      },
    });

    const participantUserIds = Array.from(
      new Set(existing.registrations.map((r) => r.userId).filter(Boolean) as string[])
    );
    if (participantUserIds.length > 0) {
      await prisma.notification.createMany({
        data: participantUserIds.map((uid) => ({
          userId: uid,
          type: NotificationType.GENERAL,
          title: 'Tournament Results & Standings Updated',
          message: `Standings and match results were updated for "${existing.title}".`,
          link: `/events/${id}`,
        })),
      });
    }

    await invalidateTournamentsCache();
    await recordAuditLog({
      userId: session.userId,
      action: 'TOURNAMENT_RESULTS_UPDATED',
      entityType: 'TOURNAMENT',
      entityId: id,
      notes: `Updated leaderboard/results for "${existing.title}"${parsed.markCompleted ? ' (Marked COMPLETED)' : ''}`,
      request,
    });

    return ok(toTournamentDto(updated, session.userId));
  } catch (error) {
    return handleRouteError(error);
  }
}
