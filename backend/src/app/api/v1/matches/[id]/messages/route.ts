import { NextRequest } from 'next/server';
import { z } from 'zod';
import { NotificationType, ParticipantStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok, toEpoch } from '@/lib/http';
import { verifySession } from '@/lib/auth';

const postMessageSchema = z.object({
  content: z.string().trim().min(1, 'Message cannot be empty').max(1000, 'Message too long'),
  mode: z.enum(['group', 'dm']).optional(),
  recipientId: z.string().trim().optional().nullable(),
});

function toMessageDto(m: {
  id: string;
  matchId: string;
  senderId: string;
  recipientId: string | null;
  content: string;
  createdAt: Date;
  sender: { id: string; fullName: string; profileImageUrl: string | null };
}) {
  return {
    id: m.id,
    matchId: m.matchId,
    senderId: m.senderId,
    senderName: m.sender.fullName,
    senderAvatar: m.sender.profileImageUrl ?? null,
    recipientId: m.recipientId,
    content: m.content,
    createdAt: toEpoch(m.createdAt),
  };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Please sign in to access match chat', 401);
    }

    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') === 'group' ? 'group' : 'dm';
    const withUserId = searchParams.get('withUserId')?.trim() || '';

    const match = await prisma.match.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        organizerId: true,
        organizer: { select: { id: true, fullName: true, profileImageUrl: true } },
        participants: {
          where: { status: ParticipantStatus.CONFIRMED, leftAt: null },
          include: {
            user: { select: { id: true, fullName: true, profileImageUrl: true } },
          },
        },
      },
    });

    if (!match) {
      return fail('RESOURCE_NOT_FOUND', 'Match not found', 404);
    }

    const isOrganizer = match.organizerId === session.userId;
    const isAdmin = session.roles.includes('ADMIN');
    const isConfirmedPlayer = match.participants.some((p) => p.userId === session.userId);
    const canAccessGroupChat = isOrganizer || isConfirmedPlayer || isAdmin;

    // Build direct-message contact threads visible to organizer (joined players + any players who wrote)
    let threads: Array<{ id: string; name: string; avatar: string | null; isJoined: boolean }> = [];
    if (isOrganizer || isAdmin) {
      const dmPartners = await prisma.matchMessage.findMany({
        where: {
          matchId: id,
          recipientId: { not: null },
        },
        select: {
          sender: { select: { id: true, fullName: true, profileImageUrl: true } },
          recipient: { select: { id: true, fullName: true, profileImageUrl: true } },
        },
      });

      const partnerMap = new Map<
        string,
        { id: string; name: string; avatar: string | null; isJoined: boolean }
      >();

      for (const p of match.participants) {
        if (p.userId !== match.organizerId) {
          partnerMap.set(p.userId, {
            id: p.user.id,
            name: p.user.fullName,
            avatar: p.user.profileImageUrl ?? null,
            isJoined: true,
          });
        }
      }

      for (const row of dmPartners) {
        for (const u of [row.sender, row.recipient]) {
          if (u && u.id !== match.organizerId && !partnerMap.has(u.id)) {
            partnerMap.set(u.id, {
              id: u.id,
              name: u.fullName,
              avatar: u.profileImageUrl ?? null,
              isJoined: false,
            });
          }
        }
      }

      threads = Array.from(partnerMap.values());
    } else {
      threads = [
        {
          id: match.organizer.id,
          name: match.organizer.fullName,
          avatar: match.organizer.profileImageUrl ?? null,
          isJoined: true,
        },
      ];
    }

    if (mode === 'group') {
      if (!canAccessGroupChat) {
        return fail(
          'ACCESS_DENIED',
          'Only confirmed match players and the organizer can access Group Chat.',
          403
        );
      }

      const groupMessages = await prisma.matchMessage.findMany({
        where: { matchId: id, recipientId: null },
        orderBy: { createdAt: 'asc' },
        take: 150,
        include: {
          sender: { select: { id: true, fullName: true, profileImageUrl: true } },
        },
      });

      return ok({
        mode: 'group',
        isOrganizer,
        canAccessGroupChat,
        threads,
        messages: groupMessages.map(toMessageDto),
      });
    }

    // Direct Message mode
    const partnerId = isOrganizer || isAdmin ? withUserId || threads[0]?.id || '' : match.organizerId;
    if (!partnerId) {
      return ok({
        mode: 'dm',
        isOrganizer,
        canAccessGroupChat,
        threads,
        messages: [],
      });
    }

    const dmMessages = await prisma.matchMessage.findMany({
      where: {
        matchId: id,
        recipientId: { not: null },
        OR: [
          { senderId: session.userId, recipientId: partnerId },
          { senderId: partnerId, recipientId: session.userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take: 150,
      include: {
        sender: { select: { id: true, fullName: true, profileImageUrl: true } },
      },
    });

    return ok({
      mode: 'dm',
      isOrganizer,
      canAccessGroupChat,
      activePartnerId: partnerId,
      threads,
      messages: dmMessages.map(toMessageDto),
    });
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
    if (!session) {
      return fail('UNAUTHORIZED', 'Please sign in to send messages', 401);
    }

    const { id } = await context.params;
    const body = await request.json();
    const parsed = postMessageSchema.parse(body);

    const match = await prisma.match.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        organizerId: true,
        participants: {
          where: { status: ParticipantStatus.CONFIRMED, leftAt: null },
          select: { userId: true },
        },
      },
    });

    if (!match) {
      return fail('RESOURCE_NOT_FOUND', 'Match not found', 404);
    }

    const isOrganizer = match.organizerId === session.userId;
    const isAdmin = session.roles.includes('ADMIN');
    const isConfirmedPlayer = match.participants.some((p) => p.userId === session.userId);
    const canAccessGroupChat = isOrganizer || isConfirmedPlayer || isAdmin;

    const mode = parsed.mode ?? (parsed.recipientId ? 'dm' : canAccessGroupChat ? 'group' : 'dm');

    if (mode === 'group') {
      if (!canAccessGroupChat) {
        return fail(
          'ACCESS_DENIED',
          'Join this match first to chat in the group channel, or message the organizer directly.',
          403
        );
      }

      const created = await prisma.matchMessage.create({
        data: {
          matchId: id,
          senderId: session.userId,
          recipientId: null,
          content: parsed.content,
        },
        include: {
          sender: { select: { id: true, fullName: true, profileImageUrl: true } },
        },
      });

      return ok(toMessageDto(created), 201);
    }

    // Direct message
    const targetRecipientId =
      isOrganizer || isAdmin ? parsed.recipientId || '' : match.organizerId;

    if (!targetRecipientId || targetRecipientId === session.userId) {
      return fail('BAD_REQUEST', 'Select a valid recipient to send a direct message', 400);
    }

    const recipientUser = await prisma.user.findUnique({
      where: { id: targetRecipientId },
      select: { id: true },
    });
    if (!recipientUser) {
      return fail('RESOURCE_NOT_FOUND', 'Recipient user not found', 404);
    }

    const created = await prisma.matchMessage.create({
      data: {
        matchId: id,
        senderId: session.userId,
        recipientId: targetRecipientId,
        content: parsed.content,
      },
      include: {
        sender: { select: { id: true, fullName: true, profileImageUrl: true } },
      },
    });

    await prisma.notification.create({
      data: {
        userId: targetRecipientId,
        type: NotificationType.GENERAL,
        title: `Message on "${match.title}"`,
        message: `${created.sender.fullName}: ${parsed.content.slice(0, 120)}`,
        link: isOrganizer ? `/matches/${id}` : `/organizer/matches/${id}`,
      },
    });

    return ok(toMessageDto(created), 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
