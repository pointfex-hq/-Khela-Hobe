import { NotificationType } from '@prisma/client';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/mailer';
import { areaMatchAlertEmailTemplate } from '@/lib/emailTemplates';

export interface AreaBroadcastInput {
  kind: 'Match' | 'Tournament';
  title: string;
  sport: string;
  city: string;
  area?: string | null;
  venue: string;
  schedule: string;
  link: string;
  excludeUserId?: string;
}

/**
 * Sends in-app notifications and area-targeted email alerts to active users
 * whose saved city or area matches the newly published match or tournament.
 */
export async function broadcastAreaMatchAlert({
  kind,
  title,
  sport,
  city,
  area,
  venue,
  schedule,
  link,
  excludeUserId,
}: AreaBroadcastInput): Promise<{ notifiedUsers: number; emailsAttempted: number }> {
  try {
    const cleanArea = (area || '').trim();
    const cleanCity = (city || '').trim();
    if (!cleanArea && !cleanCity) {
      return { notifiedUsers: 0, emailsAttempted: 0 };
    }

    const locationClauses: Array<Record<string, unknown>> = [];
    if (cleanArea) {
      locationClauses.push({ area: { contains: cleanArea, mode: 'insensitive' } });
      locationClauses.push({ playerProfile: { area: { contains: cleanArea, mode: 'insensitive' } } });
    }
    if (cleanCity) {
      locationClauses.push({ city: { equals: cleanCity, mode: 'insensitive' } });
      locationClauses.push({ playerProfile: { city: { equals: cleanCity, mode: 'insensitive' } } });
    }

    const candidates = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
        OR: locationClauses,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        area: true,
        city: true,
      },
      take: 40,
    });

    if (candidates.length === 0) {
      return { notifiedUsers: 0, emailsAttempted: 0 };
    }

    const prefRows = await prisma.notificationPreference.findMany({
      where: { userId: { in: candidates.map((c) => c.id) } },
      select: { userId: true, emailTournamentAlerts: true, emailMatchUpdate: true },
    });
    const prefMap = new Map(
      prefRows.map((p) => [p.userId, p.emailTournamentAlerts && p.emailMatchUpdate])
    );

    const areaLabel = cleanArea || cleanCity;

    await prisma.notification.createMany({
      data: candidates.map((u) => ({
        userId: u.id,
        type: NotificationType.MATCH_UPDATED,
        title: `New ${kind} near ${areaLabel}`,
        message: `${title} (${sport}) at ${venue} • ${schedule}`,
        link,
      })),
    });

    const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    const ctaUrl = `${frontendBase}${link.startsWith('/') ? link : `/${link}`}`;

    const emailTargets = candidates
      .filter((u) => prefMap.get(u.id) !== false && u.email && !u.email.startsWith('smoke-'))
      .slice(0, 20);

    await Promise.allSettled(
      emailTargets.map((u) => {
        const tpl = areaMatchAlertEmailTemplate({
          recipientName: u.fullName,
          kind,
          title,
          sport,
          area: cleanArea || u.area,
          city: cleanCity || u.city || 'Dhaka',
          venue,
          schedule,
          ctaUrl,
        });
        return sendEmail({
          to: u.email,
          subject: tpl.subject,
          html: tpl.html,
          text: tpl.text,
        });
      })
    );

    return { notifiedUsers: candidates.length, emailsAttempted: emailTargets.length };
  } catch (err) {
    console.warn('[AreaNotifications] Broadcast skipped:', err instanceof Error ? err.message : err);
    return { notifiedUsers: 0, emailsAttempted: 0 };
  }
}
