import { NextRequest } from 'next/server';
import { ParticipantStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok, toEpoch } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { toParticipantDto } from '@/lib/mappers';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const match = await prisma.match.findUnique({
      where: { id },
      select: { id: true, organizerId: true },
    });
    if (!match) {
      return fail('RESOURCE_NOT_FOUND', 'Match not found', 404);
    }

    const session = await verifySession(request);
    const isOrganizerOrAdmin = Boolean(
      session &&
        (match.organizerId === session.userId || session.roles.includes('ADMIN'))
    );

    const participants = await prisma.matchParticipant.findMany({
      where: {
        matchId: id,
        status: {
          in: [
            ParticipantStatus.CONFIRMED,
            ParticipantStatus.PENDING,
            ParticipantStatus.WAITLISTED,
            ParticipantStatus.NO_SHOW,
          ],
        },
        leftAt: null,
      },
      orderBy: { joinedAt: 'asc' },
      include: {
        user: {
          select: {
            fullName: true,
            profileImageUrl: true,
            ...(isOrganizerOrAdmin
              ? {
                  email: true,
                  phoneNumber: true,
                  city: true,
                  area: true,
                  primarySkillLevel: true,
                }
              : {}),
          },
        },
      },
    });

    if (!isOrganizerOrAdmin || participants.length === 0) {
      return ok(participants.map(toParticipantDto));
    }

    const userIds = Array.from(new Set(participants.map((p) => p.userId)));
    const [allHistory, ratingRows] = await Promise.all([
      prisma.matchParticipant.findMany({
        where: {
          userId: { in: userIds },
          status: { in: [ParticipantStatus.CONFIRMED, ParticipantStatus.NO_SHOW] },
          leftAt: null,
        },
        orderBy: { joinedAt: 'desc' },
        include: {
          match: {
            select: {
              id: true,
              title: true,
              startTime: true,
              status: true,
              sport: { select: { name: true } },
            },
          },
        },
      }),
      prisma.userRating.groupBy({
        by: ['targetUserId'],
        where: {
          targetUserId: { in: userIds },
          contextRole: 'ORGANIZER_TO_PLAYER',
        },
        _avg: { score: true },
        _count: { score: true },
      }),
    ]);

    const ratingByUser = new Map(
      ratingRows.map((r) => [
        r.targetUserId,
        {
          avg: r._avg.score ? Number(r._avg.score.toFixed(2)) : null,
          count: r._count.score,
        },
      ])
    );

    const historyByUser = new Map<string, typeof allHistory>();
    for (const row of allHistory) {
      const list = historyByUser.get(row.userId) || [];
      list.push(row);
      historyByUser.set(row.userId, list);
    }

    const enriched = participants.map((p) => {
      const base = toParticipantDto(p);
      const userHistory = historyByUser.get(p.userId) || [];
      const confirmedCount = userHistory.filter((h) => h.status === 'CONFIRMED').length;
      const noShowCount = userHistory.filter((h) => h.status === 'NO_SHOW').length;
      const total = confirmedCount + noShowCount;
      const showUpRate = total > 0 ? Math.round((confirmedCount / total) * 100) : 100;
      const userExtra = p.user as unknown as {
        email?: string | null;
        phoneNumber?: string | null;
        city?: string | null;
        area?: string | null;
        primarySkillLevel?: string | null;
      };

      return {
        ...base,
        email: userExtra.email ?? null,
        phoneNumber: userExtra.phoneNumber ?? null,
        city: userExtra.city ?? null,
        area: userExtra.area ?? null,
        skillLevel: userExtra.primarySkillLevel ?? null,
        stats: {
          matchesPlayed: confirmedCount,
          noShowCount,
          showUpRate,
          ratingAvg: ratingByUser.get(p.userId)?.avg ?? null,
          ratingCount: ratingByUser.get(p.userId)?.count ?? 0,
        },
        matchHistory: userHistory.slice(0, 8).map((h) => ({
          id: h.id,
          matchId: h.matchId,
          title: h.match.title,
          sport: h.match.sport?.name || 'Match',
          date: toEpoch(h.match.startTime),
          status: h.status === 'NO_SHOW' ? 'Did Not Show Up' : 'Confirmed',
        })),
      };
    });

    return ok(enriched);
  } catch (error) {
    return handleRouteError(error);
  }
}
