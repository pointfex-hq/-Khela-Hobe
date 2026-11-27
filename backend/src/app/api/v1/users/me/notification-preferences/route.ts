import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

const preferencesSchema = z.object({
  emailMatchJoin: z.boolean().optional(),
  emailApplication: z.boolean().optional(),
  emailMatchUpdate: z.boolean().optional(),
  emailTournamentAlerts: z.boolean().optional(),
  emailTicketUpdates: z.boolean().optional(),
  emailAccountSecurity: z.boolean().optional(),
  emailSafety: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
});

const DEFAULT_PREFS = {
  emailMatchJoin: true,
  emailApplication: true,
  emailMatchUpdate: true,
  emailTournamentAlerts: true,
  emailTicketUpdates: true,
  emailAccountSecurity: true,
  emailSafety: false,
  pushEnabled: false,
};

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const prefs = await prisma.notificationPreference.upsert({
      where: { userId: session.userId },
      update: {},
      create: {
        userId: session.userId,
        ...DEFAULT_PREFS,
      },
    });

    return ok({
      emailMatchJoin: prefs.emailMatchJoin,
      emailApplication: prefs.emailApplication,
      emailMatchUpdate: prefs.emailMatchUpdate,
      emailTournamentAlerts: prefs.emailTournamentAlerts,
      emailTicketUpdates: prefs.emailTicketUpdates,
      emailAccountSecurity: prefs.emailAccountSecurity,
      emailSafety: prefs.emailSafety,
      pushEnabled: prefs.pushEnabled,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

async function upsertPrefs(request: NextRequest) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const body = await request.json();
    const parsed = preferencesSchema.parse(body);

    const updated = await prisma.notificationPreference.upsert({
      where: { userId: session.userId },
      update: parsed,
      create: {
        userId: session.userId,
        ...DEFAULT_PREFS,
        ...parsed,
      },
    });

    await recordAuditLog({
      userId: session.userId,
      action: 'NOTIFICATION_PREFERENCES_UPDATED',
      entityType: 'USER',
      entityId: session.userId,
      notes: 'Updated email & alert notification preferences',
      request,
    });

    return ok({
      emailMatchJoin: updated.emailMatchJoin,
      emailApplication: updated.emailApplication,
      emailMatchUpdate: updated.emailMatchUpdate,
      emailTournamentAlerts: updated.emailTournamentAlerts,
      emailTicketUpdates: updated.emailTicketUpdates,
      emailAccountSecurity: updated.emailAccountSecurity,
      emailSafety: updated.emailSafety,
      pushEnabled: updated.pushEnabled,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: NextRequest) {
  return upsertPrefs(request);
}

export async function PATCH(request: NextRequest) {
  return upsertPrefs(request);
}
