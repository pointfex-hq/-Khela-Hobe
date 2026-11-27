import { NextRequest } from 'next/server';
import { z } from 'zod';
import { NotificationType, TournamentStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok, toEpoch } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { invalidateTournamentsCache } from '@/lib/cache';
import { resolveSafetyId } from '@/lib/tickets';
import { sendPreferenceAwareEmail } from '@/lib/emailDispatcher';
import { tournamentTeamUpdateEmailTemplate } from '@/lib/emailTemplates';

const registerTeamSchema = z.object({
  teamName: z.string().trim().min(2).max(120),
  captainName: z.string().trim().min(2).max(120).optional(),
  contactPhone: z.string().trim().min(6).max(30),
  contactEmail: z.string().trim().email().max(150).optional().nullable(),
  memberSafetyIds: z.array(z.string().trim()).optional().default([]),
  paymentPreference: z.enum(['ONLINE', 'VENUE', 'FREE']).optional().default('VENUE'),
  notes: z.string().trim().max(500).optional().nullable(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Please sign in to register your team', 401);
    }

    const { id } = await context.params;
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        registrations: {
          where: { status: { notIn: ['REJECTED', 'PENDING_PAYMENT'] } },
          select: { id: true, teamName: true },
        },
      },
    });

    if (!tournament) {
      return fail('RESOURCE_NOT_FOUND', 'Tournament not found', 404);
    }

    if (tournament.status !== TournamentStatus.APPROVED) {
      return fail(
        'BAD_REQUEST',
        'This tournament is not open for registration right now',
        400
      );
    }

    if (tournament.registrations.length >= tournament.maxTeams) {
      return fail('BAD_REQUEST', 'Tournament has reached maximum team capacity', 400);
    }

    const body = await request.json();
    const parsed = registerTeamSchema.parse(body);

    const captain = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { playerProfile: { include: { safetyProfile: true } } },
    });

    if (!captain) {
      return fail('UNAUTHORIZED', 'User not found', 401);
    }

    const captainSafetyId = (
      captain.playerProfile?.safetyProfile?.safetyId ||
      `KH-${captain.id.slice(-8)}`
    ).toUpperCase();

    const members: Array<{
      userId: string;
      safetyId: string;
      fullName: string;
      phoneNumber: string | null;
      role: string;
    }> = [
      {
        userId: captain.id,
        safetyId: captainSafetyId,
        fullName: parsed.captainName || captain.fullName,
        phoneNumber: parsed.contactPhone || captain.phoneNumber || null,
        role: 'Captain',
      },
    ];

    const seenUserIds = new Set<string>([captain.id]);
    for (const rawId of parsed.memberSafetyIds) {
      if (!rawId.trim()) continue;
      const resolved = await resolveSafetyId(rawId);
      if (!resolved) {
        return fail(
          'VALIDATION_ERROR',
          `No player found with Safety ID "${rawId}". Ask your teammate for their exact Safety ID from their Profile.`,
          400
        );
      }
      if (seenUserIds.has(resolved.id)) {
        return fail(
          'VALIDATION_ERROR',
          `Duplicate player detected (${resolved.fullName} / ${resolved.safetyId}). Each squad member must be unique.`,
          400
        );
      }
      seenUserIds.add(resolved.id);
      members.push({
        userId: resolved.id,
        safetyId: resolved.safetyId,
        fullName: resolved.fullName,
        phoneNumber: resolved.phoneNumber,
        role: 'Player',
      });
    }

    if (members.length < tournament.teamSize) {
      return fail(
        'VALIDATION_ERROR',
        `Squad requires ${tournament.teamSize} players (Captain + ${Math.max(0, tournament.teamSize - 1)} teammate Safety IDs). Currently ${members.length} added.`,
        400
      );
    }
    if (members.length > tournament.teamSize) {
      return fail(
        'VALIDATION_ERROR',
        `Squad cannot exceed ${tournament.teamSize} players.`,
        400
      );
    }

    const requiresOnlinePayment =
      tournament.paymentMode === 'ONLINE_REQUIRED' && tournament.entryFee > 0;
    const choseOnlinePayment =
      tournament.paymentMode === 'OPTIONAL_VENUE' &&
      parsed.paymentPreference === 'ONLINE' &&
      tournament.entryFee > 0;

    const needsOnlineCheckout = requiresOnlinePayment || choseOnlinePayment;
    const paymentStatus =
      tournament.paymentMode === 'OPEN_FREE' || tournament.entryFee <= 0
        ? 'FREE'
        : needsOnlineCheckout
          ? 'UNPAID'
          : 'PENDING_VENUE';

    const status = needsOnlineCheckout
      ? 'PENDING_PAYMENT'
      : tournament.requireTeamApproval
        ? 'PENDING'
        : 'CONFIRMED';

    const created = await prisma.tournamentRegistration.create({
      data: {
        tournamentId: id,
        userId: session.userId,
        teamName: parsed.teamName,
        captainName: parsed.captainName || captain.fullName || 'Captain',
        contactPhone: parsed.contactPhone,
        contactEmail: parsed.contactEmail || captain.email || null,
        membersJson: members,
        paymentStatus,
        notes: parsed.notes ?? null,
        status,
      },
    });

    if (!needsOnlineCheckout && tournament.organizerId !== session.userId) {
      await prisma.notification.create({
        data: {
          userId: tournament.organizerId,
          type: NotificationType.GENERAL,
          title: 'New Tournament Team Application',
          message: `Team "${created.teamName}" (${members.length} players) applied for "${tournament.title}".`,
          link: `/events/${id}`,
        },
      });
    }

    await invalidateTournamentsCache();

    const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
    const tpl = tournamentTeamUpdateEmailTemplate({
      recipientName: created.captainName,
      tournamentTitle: tournament.title,
      teamName: created.teamName,
      statusLabel:
        status === 'CONFIRMED'
          ? 'Confirmed'
          : status === 'PENDING_PAYMENT'
            ? 'Awaiting Online Payment'
            : 'Pending Organizer Approval',
      paymentText:
        paymentStatus === 'FREE'
          ? 'Free Entry'
          : paymentStatus === 'PENDING_VENUE'
            ? `BDT ${tournament.entryFee} (Pay at Venue)`
            : `BDT ${tournament.entryFee} Online Checkout`,
      eventUrl: `${frontendBase}/events/${id}`,
    });
    await sendPreferenceAwareEmail({
      userId: session.userId,
      preferenceKey: 'emailMatchJoin',
      toEmail: created.contactEmail,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
    });

    return ok(
      {
        id: created.id,
        name: created.teamName,
        teamName: created.teamName,
        captain: created.captainName,
        phone: created.contactPhone,
        membersJson: members,
        members: members.length,
        paymentStatus: created.paymentStatus,
        status: created.status,
        requiresPayment: needsOnlineCheckout,
        entryFee: tournament.entryFee,
        createdAt: toEpoch(created.createdAt),
      },
      201
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
