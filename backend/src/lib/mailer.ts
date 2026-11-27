import { Resend } from 'resend';
import nodemailer, { type Transporter } from 'nodemailer';

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  delivered: boolean;
  provider: 'resend' | 'brevo' | 'gmail' | 'smtp' | 'console-preview';
  id?: string;
  error?: string;
}

let cachedTransporter: Transporter | null = null;
let cachedProviderKey: string | null = null;

function parseSenderAddress(rawFrom: string): { name: string; email: string } {
  const trimmed = rawFrom.trim();
  const match = trimmed.match(/^(.*)<([^>]+)>$/);
  if (match) {
    return {
      name: match[1].trim().replace(/^["']|["']$/g, '') || 'Khela Hobe',
      email: match[2].trim(),
    };
  }
  return { name: 'Khela Hobe', email: trimmed };
}

function getSmtpTransporter(): { transporter: Transporter; provider: 'brevo' | 'gmail' | 'smtp'; from: string } | null {
  const brevoSmtpUser = (process.env.BREVO_SMTP_USER || '').trim();
  const brevoSmtpKey = (process.env.BREVO_SMTP_KEY || '').trim();
  if (brevoSmtpUser && brevoSmtpKey) {
    const key = `brevo:${brevoSmtpUser}`;
    if (!cachedTransporter || cachedProviderKey !== key) {
      cachedTransporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: Number(process.env.BREVO_SMTP_PORT || 587),
        secure: false,
        auth: { user: brevoSmtpUser, pass: brevoSmtpKey },
      });
      cachedProviderKey = key;
    }
    const senderEmail = (process.env.BREVO_SENDER_EMAIL || brevoSmtpUser).trim();
    const from = (process.env.EMAIL_FROM || `Khela Hobe <${senderEmail}>`).trim();
    return { transporter: cachedTransporter, provider: 'brevo', from };
  }

  const gmailUser = (process.env.GMAIL_USER || '').trim();
  const gmailPass = (process.env.GMAIL_APP_PASSWORD || '').trim();
  if (gmailUser && gmailPass) {
    const key = `gmail:${gmailUser}`;
    if (!cachedTransporter || cachedProviderKey !== key) {
      cachedTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: gmailUser, pass: gmailPass },
      });
      cachedProviderKey = key;
    }
    const from = (process.env.EMAIL_FROM || `Khela Hobe <${gmailUser}>`).trim();
    return { transporter: cachedTransporter, provider: 'gmail', from };
  }

  const smtpHost = (process.env.SMTP_HOST || '').trim();
  const smtpUser = (process.env.SMTP_USER || '').trim();
  const smtpPass = (process.env.SMTP_PASS || '').trim();
  if (smtpHost && smtpUser && smtpPass) {
    const key = `smtp:${smtpHost}:${smtpUser}`;
    if (!cachedTransporter || cachedProviderKey !== key) {
      cachedTransporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT || 587) === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });
      cachedProviderKey = key;
    }
    const from = (process.env.EMAIL_FROM || `Khela Hobe <${smtpUser}>`).trim();
    return { transporter: cachedTransporter, provider: 'smtp', from };
  }

  return null;
}

/**
 * Dispatches transactional HTML email via:
 * 1) Brevo Transactional API (BREVO_API_KEY)
 * 2) Resend API (RESEND_API_KEY)
 * 3) Brevo SMTP / Gmail SMTP / Custom SMTP (nodemailer)
 * Falls back to structured console logging if no mail credentials are configured yet.
 */
export async function sendEmail({ to, subject, html, text }: SendEmailInput): Promise<SendEmailResult> {
  const cleanTo = to.trim();
  if (!cleanTo) {
    return { delivered: false, provider: 'console-preview', error: 'Empty recipient' };
  }

  const brevoApiKey = (process.env.BREVO_API_KEY || '').trim();
  if (brevoApiKey) {
    try {
      const parsedFrom = parseSenderAddress(
        process.env.BREVO_SENDER_EMAIL ||
          process.env.EMAIL_FROM ||
          'Khela Hobe <noreply@khelahobe.com>'
      );
      const senderName = (process.env.BREVO_SENDER_NAME || parsedFrom.name || 'Khela Hobe').trim();
      const senderEmail = (process.env.BREVO_SENDER_EMAIL || parsedFrom.email).trim();

      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': brevoApiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: cleanTo }],
          subject,
          htmlContent: html,
          ...(text ? { textContent: text } : {}),
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { messageId?: string; message?: string };
      if (res.ok) {
        return { delivered: true, provider: 'brevo', id: json.messageId };
      }
      console.error('[Mailer Brevo API Error]', res.status, json);
    } catch (err) {
      console.error('[Mailer Brevo API Exception]', err);
    }
  }

  const resendKey = (process.env.RESEND_API_KEY || '').trim();
  const defaultFrom = (process.env.EMAIL_FROM || 'Khela Hobe <onboarding@resend.dev>').trim();

  if (resendKey) {
    try {
      const resend = new Resend(resendKey);
      const { data, error } = await resend.emails.send({
        from: defaultFrom,
        to: cleanTo,
        subject,
        html,
        text,
      });
      if (error) {
        console.error('[Mailer Resend Error]', error);
      } else {
        return { delivered: true, provider: 'resend', id: data?.id };
      }
    } catch (err) {
      console.error('[Mailer Resend Exception]', err);
    }
  }

  const smtp = getSmtpTransporter();
  if (smtp) {
    try {
      const info = await smtp.transporter.sendMail({
        from: smtp.from,
        to: cleanTo,
        subject,
        html,
        text,
      });
      return { delivered: true, provider: smtp.provider, id: info.messageId };
    } catch (err) {
      console.error(`[Mailer ${smtp.provider} Error]`, err);
      return {
        delivered: false,
        provider: smtp.provider,
        error: err instanceof Error ? err.message : 'SMTP delivery failed',
      };
    }
  }

  console.info(`[Mailer Preview -> ${cleanTo}] ${subject}`);
  return { delivered: false, provider: 'console-preview' };
}
