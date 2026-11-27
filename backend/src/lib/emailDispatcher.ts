import prisma from '@/lib/prisma';
import { sendEmail, type SendEmailResult } from '@/lib/mailer';

export type EmailPreferenceKey =
  | 'emailMatchJoin'
  | 'emailApplication'
  | 'emailMatchUpdate'
  | 'emailTournamentAlerts'
  | 'emailTicketUpdates'
  | 'emailAccountSecurity'
  | 'emailSafety';

const PREF_DEFAULTS: Record<EmailPreferenceKey, boolean> = {
  emailMatchJoin: true,
  emailApplication: true,
  emailMatchUpdate: true,
  emailTournamentAlerts: true,
  emailTicketUpdates: true,
  emailAccountSecurity: true,
  emailSafety: false,
};

/**
 * Checks the user's NotificationPreference before sending non-OTP transactional emails.
 */
export async function sendPreferenceAwareEmail({
  userId,
  preferenceKey,
  toEmail,
  subject,
  html,
  text,
}: {
  userId?: string | null;
  preferenceKey: EmailPreferenceKey;
  toEmail?: string | null;
  subject: string;
  html: string;
  text?: string;
}): Promise<SendEmailResult | { skipped: true; reason: string }> {
  try {
    let targetEmail = (toEmail || '').trim();
    let allowed = PREF_DEFAULTS[preferenceKey];

    if (userId) {
      const [user, pref] = await Promise.all([
        targetEmail
          ? null
          : prisma.user.findUnique({ where: { id: userId }, select: { email: true, status: true } }),
        prisma.notificationPreference.findUnique({ where: { userId } }),
      ]);

      if (user) {
        if (user.status !== 'ACTIVE') {
          return { skipped: true, reason: 'User account is not active' };
        }
        targetEmail = (user.email || '').trim();
      }

      if (pref && typeof pref[preferenceKey] === 'boolean') {
        allowed = pref[preferenceKey];
      }
    }

    if (!allowed) {
      return { skipped: true, reason: `User disabled ${preferenceKey}` };
    }
    if (!targetEmail || targetEmail.startsWith('smoke-') || targetEmail.endsWith('.local')) {
      return { skipped: true, reason: 'Missing or non-routable email address' };
    }

    return await sendEmail({
      to: targetEmail,
      subject,
      html,
      text,
    });
  } catch (err) {
    console.warn('[EmailDispatcher] Failed:', err instanceof Error ? err.message : err);
    return { skipped: true, reason: 'Dispatcher error' };
  }
}
