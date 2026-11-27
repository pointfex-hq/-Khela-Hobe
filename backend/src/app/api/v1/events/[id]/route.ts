import { NextRequest } from 'next/server';
import { z } from 'zod';
import { TournamentStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok, toEpoch } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { toTournamentDto } from '@/lib/mappers';
import { invalidateTournamentsCache } from '@/lib/cache';

const updateTournamentSchema = z.object({
  title: z.string().trim().min(3).max(160).optional(),
  sport: z.string().trim().min(2).max(100).optional(),
  format: z.string().trim().max(100).optional(),
  description: z.string().trim().min(5).max(3000).optional(),
  features: z.string().trim().max(3000).optional().nullable(),
  rules: z.string().trim().max(3000).optional().nullable(),
  championPrize: z.string().trim().max(250).optional().nullable(),
  runnerUpPrize: z.string().trim().max(250).optional().nullable(),
  mvpPrize: z.string().trim().max(250).optional().nullable(),
  prizePool: z.string().trim().max(250).optional().nullable(),
  venueName: z.string().trim().min(2).max(200).optional(),
  venue: z.string().trim().min(2).max(200).optional(),
  city: z.string().trim().max(100).optional(),
  area: z.string().trim().max(100).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  startDate: z.string().trim().min(4).max(40).optional(),
  date: z.string().trim().min(4).max(40).optional(),
  time: z.string().trim().max(20).optional(),
  duration: z.string().trim().max(60).optional(),
  maxTeams: z.number().int().min(2).max(256).optional(),
  totalTeams: z.number().int().min(2).max(256).optional(),
  teamSize: z.number().int().min(1).max(30).optional(),
  entryFee: z.number().min(0).max(200000).optional(),
  paymentMode: z.enum(['OPEN_FREE', 'ONLINE_REQUIRED', 'OPTIONAL_VENUE']).optional(),
  requireTeamApproval: z.boolean().optional(),
  spectatorMode: z.enum(['NONE', 'OPEN_FREE', 'LIMITED_TICKETS']).optional(),
  spectatorCapacity: z.number().int().min(0).max(50000).optional(),
  ticketPrice: z.number().min(0).max(50000).optional(),
  vipTicketPrice: z.number().min(0).max(100000).optional().nullable(),
  coverImageUrl: z.string().trim().max(1000).optional().nullable(),
  image: z.string().trim().max(1000).optional().nullable(),
  bannerImages: z.array(z.string().trim().max(1000)).max(4).optional(),
  status: z.enum(['COMPLETED', 'CANCELLED', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED']).optional(),
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession(request);
    const { id } = await context.params;
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        organizer: { select: { id: true, fullName: true, profileImageUrl: true } },
        interests: { select: { userId: true } },
        tickets: { where: { status: { not: 'CANCELLED' } }, select: { id: true, status: true } },
        registrations: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            userId: true,
            teamName: true,
            captainName: true,
            contactPhone: true,
            contactEmail: true,
            membersJson: true,
            paymentStatus: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!tournament) {
      return fail('RESOURCE_NOT_FOUND', 'Tournament not found', 404);
    }

    const dto = {
      ...toTournamentDto(tournament, session?.userId),
      participants: tournament.registrations
        .filter((r) => r.status !== 'PENDING_PAYMENT')
        .map((r) => ({
          id: r.id,
          userId: r.userId,
          name: r.teamName,
          teamName: r.teamName,
          captain: r.captainName,
          phone: r.contactPhone,
          email: r.contactEmail,
          membersJson: Array.isArray(r.membersJson) ? r.membersJson : [],
          members: Array.isArray(r.membersJson) && r.membersJson.length > 0
            ? r.membersJson.length
            : tournament.teamSize,
          paymentStatus: r.paymentStatus,
          status: r.status,
          createdAt: toEpoch(r.createdAt),
        })),
    };

    return ok(dto);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { id } = await context.params;
    const existing = await prisma.tournament.findUnique({ where: { id } });
    if (!existing) {
      return fail('RESOURCE_NOT_FOUND', 'Tournament not found', 404);
    }

    const isAdmin = session.roles.includes('ADMIN');
    if (existing.organizerId !== session.userId && !isAdmin) {
      return fail('ACCESS_DENIED', 'Only the organizer or admin can update this tournament', 403);
    }

    const body = await request.json();
    const parsed = updateTournamentSchema.parse(body);

    const venueName = parsed.venueName || parsed.venue;
    const startDate = parsed.startDate || parsed.date;
    const maxTeams = parsed.maxTeams ?? parsed.totalTeams;
    const bannerList =
      parsed.bannerImages !== undefined
        ? parsed.bannerImages.map((u) => u.trim()).filter(Boolean).slice(0, 4)
        : undefined;
    const rawCover = parsed.coverImageUrl !== undefined ? parsed.coverImageUrl : parsed.image;
    const coverImageUrl = bannerList !== undefined ? bannerList[0] ?? null : rawCover;

    let nextStatus: TournamentStatus | undefined = parsed.status as TournamentStatus | undefined;
    if (!nextStatus && !isAdmin && existing.status === TournamentStatus.REJECTED) {
      nextStatus = TournamentStatus.PENDING_APPROVAL;
    }

    const updated = await prisma.tournament.update({
      where: { id },
      data: {
        ...(parsed.title !== undefined ? { title: parsed.title } : {}),
        ...(parsed.sport !== undefined ? { sport: parsed.sport } : {}),
        ...(parsed.format !== undefined ? { format: parsed.format } : {}),
        ...(parsed.description !== undefined ? { description: parsed.description } : {}),
        ...(parsed.features !== undefined ? { features: parsed.features } : {}),
        ...(parsed.rules !== undefined ? { rules: parsed.rules } : {}),
        ...(parsed.championPrize !== undefined ? { championPrize: parsed.championPrize } : {}),
        ...(parsed.runnerUpPrize !== undefined ? { runnerUpPrize: parsed.runnerUpPrize } : {}),
        ...(parsed.mvpPrize !== undefined ? { mvpPrize: parsed.mvpPrize } : {}),
        ...(parsed.prizePool !== undefined ? { prizePool: parsed.prizePool } : {}),
        ...(venueName !== undefined ? { venueName } : {}),
        ...(parsed.city !== undefined ? { city: parsed.city } : {}),
        ...(parsed.area !== undefined ? { area: parsed.area } : {}),
        ...(parsed.latitude !== undefined ? { latitude: parsed.latitude } : {}),
        ...(parsed.longitude !== undefined ? { longitude: parsed.longitude } : {}),
        ...(startDate !== undefined ? { startDate } : {}),
        ...(parsed.time !== undefined ? { time: parsed.time } : {}),
        ...(parsed.duration !== undefined ? { duration: parsed.duration } : {}),
        ...(maxTeams !== undefined ? { maxTeams } : {}),
        ...(parsed.teamSize !== undefined ? { teamSize: parsed.teamSize } : {}),
        ...(parsed.entryFee !== undefined ? { entryFee: parsed.entryFee } : {}),
        ...(parsed.paymentMode !== undefined ? { paymentMode: parsed.paymentMode } : {}),
        ...(parsed.requireTeamApproval !== undefined ? { requireTeamApproval: parsed.requireTeamApproval } : {}),
        ...(parsed.spectatorMode !== undefined ? { spectatorMode: parsed.spectatorMode } : {}),
        ...(parsed.spectatorCapacity !== undefined ? { spectatorCapacity: parsed.spectatorCapacity } : {}),
        ...(parsed.ticketPrice !== undefined ? { ticketPrice: parsed.ticketPrice } : {}),
        ...(parsed.vipTicketPrice !== undefined ? { vipTicketPrice: parsed.vipTicketPrice } : {}),
        ...(coverImageUrl !== undefined ? { coverImageUrl } : {}),
        ...(bannerList !== undefined
          ? { bannerImages: bannerList }
          : coverImageUrl
            ? { bannerImages: [coverImageUrl] }
            : {}),
        ...(nextStatus !== undefined ? { status: nextStatus } : {}),
      },
      include: {
        organizer: { select: { id: true, fullName: true, profileImageUrl: true } },
        registrations: { select: { id: true } },
      },
    });

    await invalidateTournamentsCache();
    return ok(toTournamentDto(updated));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { id } = await context.params;
    const existing = await prisma.tournament.findUnique({ where: { id } });
    if (!existing) {
      return fail('RESOURCE_NOT_FOUND', 'Tournament not found', 404);
    }

    const isAdmin = session.roles.includes('ADMIN');
    if (existing.organizerId !== session.userId && !isAdmin) {
      return fail('ACCESS_DENIED', 'Only the organizer or admin can delete this tournament', 403);
    }

    await prisma.tournament.delete({ where: { id } });
    await invalidateTournamentsCache();
    return ok({ deleted: true, id });
  } catch (error) {
    return handleRouteError(error);
  }
}
