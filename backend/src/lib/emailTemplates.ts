function escapeHtml(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrapEmailLayout(title: string, badge: string, bodyHtml: string, footerNote?: string): string {
  const safeTitle = escapeHtml(title);
  const safeBadge = escapeHtml(badge);
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
</head>
<body style="margin:0;padding:0;background-color:#0b1311;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f3f7f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0b1311;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px;background-color:#15211d;border:1px solid #263931;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:24px 28px;background:linear-gradient(135deg,#101a17 0%,#1d3129 100%);border-bottom:1px solid #263931;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="display:inline-block;padding:6px 12px;border-radius:999px;background-color:#B9F34A;color:#131F00;font-size:11px;font-weight:800;letter-spacing:0.6px;text-transform:uppercase;">
                      KHELA HOBE
                    </span>
                  </td>
                  <td align="right">
                    <span style="display:inline-block;padding:5px 10px;border-radius:999px;border:1px solid #2c4339;background-color:#101a17;color:#B9F34A;font-size:11px;font-weight:600;">
                      ${safeBadge}
                    </span>
                  </td>
                </tr>
              </table>
              <h1 style="margin:18px 0 0;font-size:22px;line-height:1.3;font-weight:800;color:#ffffff;">
                ${safeTitle}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;font-size:14px;line-height:1.6;color:#d6e2dc;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px;background-color:#101a17;border-top:1px solid #263931;font-size:12px;color:#8a9b93;">
              <p style="margin:0 0 4px;">
                ${escapeHtml(footerNote || 'Khela Hobe — Recreational Sports Discovery & Match Network across Bangladesh.')}
              </p>
              <p style="margin:0;color:#5c6e65;">
                © ${year} Khela Hobe • Automated Service Notification
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function otpVerificationEmailTemplate({
  name,
  code,
  expiresMinutes = 15,
}: {
  name: string;
  code: string;
  expiresMinutes?: number;
}) {
  const safeName = escapeHtml(name || 'Athlete');
  const safeCode = escapeHtml(code);

  const body = `
    <p style="margin:0 0 14px;">Hi <strong style="color:#ffffff;">${safeName}</strong>,</p>
    <p style="margin:0 0 18px;">
      Welcome to <strong>Khela Hobe</strong>! Enter the 6-digit verification code below to confirm your email address and unlock verified athlete features:
    </p>
    <div style="margin:22px 0;padding:18px;border-radius:12px;background-color:#0f1916;border:1px solid #B9F34A;text-align:center;">
      <span style="display:block;font-size:11px;text-transform:uppercase;letter-spacing:1.2px;color:#9baaa2;margin-bottom:6px;">Email Verification OTP</span>
      <span style="display:inline-block;font-family:'Courier New',monospace;font-size:32px;font-weight:800;letter-spacing:8px;color:#B9F34A;">
        ${safeCode}
      </span>
    </div>
    <p style="margin:0 0 10px;font-size:13px;color:#9baaa2;">
      This code expires in <strong style="color:#ffffff;">${expiresMinutes} minutes</strong>. Never share this OTP with anyone.
    </p>
    <p style="margin:0;font-size:12px;color:#7c8d84;">
      Tip: Signing in with or linking a Google account automatically verifies your email as well.
    </p>
  `;

  return {
    subject: `${safeCode} is your Khela Hobe email verification code`,
    html: wrapEmailLayout('Verify Your Email Address', 'Email OTP', body),
    text: `Hi ${name}, your Khela Hobe email verification OTP is ${code}. It expires in ${expiresMinutes} minutes.`,
  };
}

export function passwordResetEmailTemplate({
  name,
  code,
  expiresMinutes = 15,
}: {
  name: string;
  code: string;
  expiresMinutes?: number;
}) {
  const safeName = escapeHtml(name || 'Player');
  const safeCode = escapeHtml(code);

  const body = `
    <p style="margin:0 0 14px;">Hi <strong style="color:#ffffff;">${safeName}</strong>,</p>
    <p style="margin:0 0 18px;">
      We received a request to reset your Khela Hobe account password. Use this 6-digit security OTP on the Reset Password screen:
    </p>
    <div style="margin:22px 0;padding:18px;border-radius:12px;background-color:#0f1916;border:1px solid #FF9F43;text-align:center;">
      <span style="display:block;font-size:11px;text-transform:uppercase;letter-spacing:1.2px;color:#9baaa2;margin-bottom:6px;">Password Reset OTP</span>
      <span style="display:inline-block;font-family:'Courier New',monospace;font-size:32px;font-weight:800;letter-spacing:8px;color:#FF9F43;">
        ${safeCode}
      </span>
    </div>
    <p style="margin:0;font-size:13px;color:#9baaa2;">
      Valid for <strong style="color:#ffffff;">${expiresMinutes} minutes</strong>. If you did not request a password reset, you can safely ignore this email.
    </p>
  `;

  return {
    subject: `${safeCode} — Khela Hobe Password Reset Code`,
    html: wrapEmailLayout('Reset Your Password', 'Security OTP', body),
    text: `Hi ${name}, your Khela Hobe password reset OTP is ${code}. Valid for ${expiresMinutes} minutes.`,
  };
}

export function areaMatchAlertEmailTemplate({
  recipientName,
  kind,
  title,
  sport,
  area,
  city,
  venue,
  schedule,
  ctaUrl,
}: {
  recipientName: string;
  kind: 'Match' | 'Tournament';
  title: string;
  sport: string;
  area?: string | null;
  city: string;
  venue: string;
  schedule: string;
  ctaUrl: string;
}) {
  const safeKind = escapeHtml(kind);
  const safeTitle = escapeHtml(title);
  const loc = escapeHtml([area, city].filter(Boolean).join(', ') || 'Bangladesh');

  const body = `
    <p style="margin:0 0 14px;">Hi <strong style="color:#ffffff;">${escapeHtml(recipientName || 'Athlete')}</strong>,</p>
    <p style="margin:0 0 16px;">
      A new <strong style="color:#B9F34A;">${safeKind}</strong> was just posted near your area (<strong style="color:#ffffff;">${loc}</strong>):
    </p>
    <div style="margin:16px 0;padding:16px 18px;border-radius:12px;background-color:#0f1916;border:1px solid #263931;">
      <span style="display:inline-block;padding:3px 10px;border-radius:999px;background-color:rgba(185,243,74,0.16);color:#B9F34A;font-size:11px;font-weight:700;margin-bottom:8px;">
        ${escapeHtml(sport)} • ${safeKind}
      </span>
      <h2 style="margin:4px 0 8px;font-size:17px;color:#ffffff;">${safeTitle}</h2>
      <p style="margin:0 0 4px;font-size:13px;color:#cbd7d1;"><strong>Venue:</strong> ${escapeHtml(venue)} (${loc})</p>
      <p style="margin:0;font-size:13px;color:#cbd7d1;"><strong>Schedule:</strong> ${escapeHtml(schedule)}</p>
    </div>
    <p style="margin:20px 0 0;">
      <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;padding:12px 22px;border-radius:8px;background-color:#B9F34A;color:#131F00;font-weight:800;font-size:13px;text-decoration:none;">
        View ${safeKind} &amp; Claim Your Spot →
      </a>
    </p>
  `;

  return {
    subject: `New ${kind} near ${area || city}: ${title}`,
    html: wrapEmailLayout(`New ${kind} Near ${area || city}`, `${sport} Alert`, body),
    text: `New ${kind} near ${area || city}: ${title} (${sport}) at ${venue} on ${schedule}. View here: ${ctaUrl}`,
  };
}

export function organizerApprovalEmailTemplate({
  name,
  approved,
  note,
  dashboardUrl,
}: {
  name: string;
  approved: boolean;
  note?: string | null;
  dashboardUrl: string;
}) {
  const safeName = escapeHtml(name || 'Organizer');
  const statusColor = approved ? '#32C77A' : '#FF5C5C';
  const heading = approved ? 'Organizer Account Verified!' : 'Organizer Verification Update';

  const body = `
    <p style="margin:0 0 14px;">Hi <strong style="color:#ffffff;">${safeName}</strong>,</p>
    <p style="margin:0 0 16px;">
      An administrator has reviewed your Organizer verification request on Khela Hobe.
    </p>
    <div style="margin:16px 0;padding:14px 16px;border-radius:10px;background-color:#0f1916;border-left:4px solid ${statusColor};">
      <strong style="color:${statusColor};display:block;margin-bottom:4px;">
        Status: ${approved ? 'APPROVED — Full Organizer Creation Unlocked' : 'REJECTED — Action Needed'}
      </strong>
      ${note ? `<span style="font-size:13px;color:#cbd7d1;">Admin Note: ${escapeHtml(note)}</span>` : ''}
    </div>
    <p style="margin:18px 0 0;">
      <a href="${escapeHtml(dashboardUrl)}" style="display:inline-block;padding:11px 20px;border-radius:8px;background-color:#B9F34A;color:#131F00;font-weight:800;font-size:13px;text-decoration:none;">
        Open Organizer Workspace →
      </a>
    </p>
  `;

  return {
    subject: approved
      ? 'Your Khela Hobe Organizer account is now verified!'
      : 'Update on your Khela Hobe Organizer application',
    html: wrapEmailLayout(heading, approved ? 'Verified' : 'Notice', body),
    text: `Hi ${name}, your Organizer verification status is ${approved ? 'APPROVED' : 'REJECTED'}. ${note || ''}`,
  };
}

export function ticketBookingEmailTemplate({
  recipientName,
  eventTitle,
  tierName,
  ticketCodes,
  quantity,
  totalAmount,
  discountAmount = 0,
  paymentStatus,
  venue,
  schedule,
  ticketsUrl,
}: {
  recipientName: string;
  eventTitle: string;
  tierName: string;
  ticketCodes: string[];
  quantity: number;
  totalAmount: number;
  discountAmount?: number;
  paymentStatus: string;
  venue: string;
  schedule: string;
  ticketsUrl: string;
}) {
  const safeName = escapeHtml(recipientName || 'Spectator');
  const safeTitle = escapeHtml(eventTitle);
  const codeBadges = ticketCodes
    .map(
      (c) =>
        `<span style="display:inline-block;margin:4px 6px 4px 0;padding:6px 10px;border-radius:6px;background-color:#15211d;border:1px solid #B9F34A;color:#B9F34A;font-family:'Courier New',monospace;font-size:13px;font-weight:800;">${escapeHtml(c)}</span>`
    )
    .join('');

  const body = `
    <p style="margin:0 0 14px;">Hi <strong style="color:#ffffff;">${safeName}</strong>,</p>
    <p style="margin:0 0 16px;">
      Your spectator ticket order for <strong style="color:#B9F34A;">${safeTitle}</strong> is confirmed!
    </p>
    <div style="margin:16px 0;padding:16px 18px;border-radius:12px;background-color:#0f1916;border:1px solid #263931;">
      <p style="margin:0 0 6px;font-size:13px;color:#cbd7d1;"><strong>Tier:</strong> ${escapeHtml(tierName)} &times; ${quantity}</p>
      <p style="margin:0 0 6px;font-size:13px;color:#cbd7d1;"><strong>Venue:</strong> ${escapeHtml(venue)}</p>
      <p style="margin:0 0 6px;font-size:13px;color:#cbd7d1;"><strong>Schedule:</strong> ${escapeHtml(schedule)}</p>
      <p style="margin:0 0 6px;font-size:13px;color:#cbd7d1;"><strong>Payment:</strong> <strong style="color:#32C77A;">${escapeHtml(paymentStatus)}</strong> ${totalAmount > 0 ? `(BDT ${totalAmount.toFixed(0)})` : '(Free Pass)'}</p>
      ${discountAmount > 0 ? `<p style="margin:0 0 8px;font-size:12px;color:#B9F34A;">Coupon Savings Applied: BDT ${discountAmount.toFixed(0)}</p>` : ''}
      <div style="margin-top:12px;padding-top:10px;border-top:1px dashed #2c4339;">
        <span style="display:block;font-size:11px;text-transform:uppercase;color:#9baaa2;margin-bottom:6px;">Your Ticket Pass Code(s)</span>
        ${codeBadges}
      </div>
    </div>
    <p style="margin:18px 0 0;">
      <a href="${escapeHtml(ticketsUrl)}" style="display:inline-block;padding:12px 22px;border-radius:8px;background-color:#B9F34A;color:#131F00;font-weight:800;font-size:13px;text-decoration:none;">
        Open QR Wallet &amp; Save Offline PDF Pass →
      </a>
    </p>
  `;

  return {
    subject: `Ticket Confirmed: ${eventTitle} (${ticketCodes[0] || `${quantity} pass`})`,
    html: wrapEmailLayout('Your Spectator Tickets Are Ready', 'Ticket Confirmed', body),
    text: `Hi ${recipientName}, your ${quantity} ticket(s) for ${eventTitle} (${tierName}) are confirmed. Codes: ${ticketCodes.join(', ')}. Status: ${paymentStatus}. View wallet: ${ticketsUrl}`,
  };
}

export function ticketCheckInEmailTemplate({
  recipientName,
  eventTitle,
  ticketCode,
  tierName,
}: {
  recipientName: string;
  eventTitle: string;
  ticketCode: string;
  tierName: string;
}) {
  const body = `
    <p style="margin:0 0 14px;">Hi <strong style="color:#ffffff;">${escapeHtml(recipientName || 'Spectator')}</strong>,</p>
    <p style="margin:0 0 16px;">
      Your pass <strong style="font-family:'Courier New',monospace;color:#B9F34A;">${escapeHtml(ticketCode)}</strong> (${escapeHtml(tierName)}) has been scanned and checked in at the venue gate for <strong style="color:#ffffff;">${escapeHtml(eventTitle)}</strong>.
    </p>
    <p style="margin:0;font-size:13px;color:#9baaa2;">Enjoy the tournament!</p>
  `;

  return {
    subject: `Checked In: ${ticketCode} — ${eventTitle}`,
    html: wrapEmailLayout('Venue Gate Check-In Complete', 'Pass Used', body),
    text: `Your ticket ${ticketCode} for ${eventTitle} has been checked in and marked USED.`,
  };
}

export function matchJoinConfirmedEmailTemplate({
  recipientName,
  matchTitle,
  sport,
  venue,
  schedule,
  feeText,
  matchUrl,
}: {
  recipientName: string;
  matchTitle: string;
  sport: string;
  venue: string;
  schedule: string;
  feeText?: string;
  matchUrl: string;
}) {
  const body = `
    <p style="margin:0 0 14px;">Hi <strong style="color:#ffffff;">${escapeHtml(recipientName || 'Athlete')}</strong>,</p>
    <p style="margin:0 0 16px;">Your spot is locked in for <strong style="color:#B9F34A;">${escapeHtml(matchTitle)}</strong>!</p>
    <div style="margin:16px 0;padding:14px 16px;border-radius:10px;background-color:#0f1916;border:1px solid #263931;">
      <p style="margin:0 0 4px;font-size:13px;color:#cbd7d1;"><strong>Sport:</strong> ${escapeHtml(sport)}</p>
      <p style="margin:0 0 4px;font-size:13px;color:#cbd7d1;"><strong>Venue:</strong> ${escapeHtml(venue)}</p>
      <p style="margin:0 0 4px;font-size:13px;color:#cbd7d1;"><strong>Schedule:</strong> ${escapeHtml(schedule)}</p>
      ${feeText ? `<p style="margin:0;font-size:13px;color:#32C77A;"><strong>Fee:</strong> ${escapeHtml(feeText)}</p>` : ''}
    </div>
    <p style="margin:18px 0 0;">
      <a href="${escapeHtml(matchUrl)}" style="display:inline-block;padding:11px 20px;border-radius:8px;background-color:#B9F34A;color:#131F00;font-weight:800;font-size:13px;text-decoration:none;">
        View Match Details &amp; Squad Chat →
      </a>
    </p>
  `;

  return {
    subject: `Spot Confirmed: ${matchTitle}`,
    html: wrapEmailLayout('Match Spot Confirmed', 'Match Roster', body),
    text: `Your spot in ${matchTitle} (${sport}) at ${venue} on ${schedule} is confirmed. ${matchUrl}`,
  };
}

export function matchApplicationUpdateEmailTemplate({
  recipientName,
  matchTitle,
  approved,
  note,
  matchUrl,
}: {
  recipientName: string;
  matchTitle: string;
  approved: boolean;
  note?: string | null;
  matchUrl: string;
}) {
  const statusColor = approved ? '#32C77A' : '#FF5C5C';
  const body = `
    <p style="margin:0 0 14px;">Hi <strong style="color:#ffffff;">${escapeHtml(recipientName || 'Athlete')}</strong>,</p>
    <p style="margin:0 0 16px;">
      The organizer reviewed your application for <strong style="color:#ffffff;">${escapeHtml(matchTitle)}</strong>.
    </p>
    <div style="margin:16px 0;padding:14px 16px;border-radius:10px;background-color:#0f1916;border-left:4px solid ${statusColor};">
      <strong style="color:${statusColor};display:block;margin-bottom:4px;">
        ${approved ? 'APPROVED — You Are on the Match Roster' : 'DECLINED'}
      </strong>
      ${note ? `<span style="font-size:13px;color:#cbd7d1;">Note: ${escapeHtml(note)}</span>` : ''}
    </div>
    <p style="margin:18px 0 0;">
      <a href="${escapeHtml(matchUrl)}" style="display:inline-block;padding:11px 20px;border-radius:8px;background-color:#B9F34A;color:#131F00;font-weight:800;font-size:13px;text-decoration:none;">
        Open Match Page →
      </a>
    </p>
  `;

  return {
    subject: `${approved ? 'Approved' : 'Update'}: Application for ${matchTitle}`,
    html: wrapEmailLayout('Match Application Update', approved ? 'Approved' : 'Application', body),
    text: `Your application for ${matchTitle} was ${approved ? 'APPROVED' : 'DECLINED'}. ${note || ''} ${matchUrl}`,
  };
}

export function tournamentTeamUpdateEmailTemplate({
  recipientName,
  tournamentTitle,
  teamName,
  statusLabel,
  paymentText,
  eventUrl,
}: {
  recipientName: string;
  tournamentTitle: string;
  teamName: string;
  statusLabel: string;
  paymentText?: string;
  eventUrl: string;
}) {
  const body = `
    <p style="margin:0 0 14px;">Hi <strong style="color:#ffffff;">${escapeHtml(recipientName || 'Captain')}</strong>,</p>
    <p style="margin:0 0 16px;">
      Update for team <strong style="color:#B9F34A;">${escapeHtml(teamName)}</strong> in <strong>${escapeHtml(tournamentTitle)}</strong>:
    </p>
    <div style="margin:16px 0;padding:14px 16px;border-radius:10px;background-color:#0f1916;border:1px solid #263931;">
      <p style="margin:0 0 4px;font-size:13px;color:#cbd7d1;"><strong>Registration Status:</strong> <strong style="color:#B9F34A;">${escapeHtml(statusLabel)}</strong></p>
      ${paymentText ? `<p style="margin:0;font-size:13px;color:#cbd7d1;"><strong>Payment:</strong> ${escapeHtml(paymentText)}</p>` : ''}
    </div>
    <p style="margin:18px 0 0;">
      <a href="${escapeHtml(eventUrl)}" style="display:inline-block;padding:11px 20px;border-radius:8px;background-color:#B9F34A;color:#131F00;font-weight:800;font-size:13px;text-decoration:none;">
        View Tournament Hub →
      </a>
    </p>
  `;

  return {
    subject: `Team "${teamName}" — ${tournamentTitle} (${statusLabel})`,
    html: wrapEmailLayout('Tournament Squad Update', 'Tournament Team', body),
    text: `Team ${teamName} in ${tournamentTitle}: ${statusLabel}. ${paymentText || ''} ${eventUrl}`,
  };
}

export function guardianLinkRequestEmailTemplate({
  recipientName,
  guardianName,
  safetyId,
  profileUrl,
}: {
  recipientName: string;
  guardianName: string;
  safetyId: string;
  profileUrl: string;
}) {
  const body = `
    <p style="margin:0 0 14px;">Hi <strong style="color:#ffffff;">${escapeHtml(recipientName || 'Athlete')}</strong>,</p>
    <p style="margin:0 0 16px;">
      <strong style="color:#ffffff;">${escapeHtml(guardianName)}</strong> has sent a Guardian Safety Link request using Safety ID <strong style="font-family:'Courier New',monospace;color:#B9F34A;">${escapeHtml(safetyId)}</strong>.
    </p>
    <p style="margin:0 0 16px;font-size:13px;color:#9baaa2;">
      You can review and Accept or Reject this request anytime from your Profile or Notifications page.
    </p>
    <p style="margin:18px 0 0;">
      <a href="${escapeHtml(profileUrl)}" style="display:inline-block;padding:11px 20px;border-radius:8px;background-color:#B9F34A;color:#131F00;font-weight:800;font-size:13px;text-decoration:none;">
        Review Safety Request →
      </a>
    </p>
  `;

  return {
    subject: `Safety Link Request from ${guardianName}`,
    html: wrapEmailLayout('Guardian Safety Link Request', 'Safety & Trust', body),
    text: `${guardianName} requested a Guardian Safety Link for Safety ID ${safetyId}. Review at ${profileUrl}`,
  };
}

export function organizerSettlementEmailTemplate({
  organizerName,
  grossAmount,
  platformFeeRate,
  platformFeeAmount,
  netPayoutAmount,
  payoutMethod,
  payoutAccount,
  referenceNo,
}: {
  organizerName: string;
  grossAmount: number;
  platformFeeRate: number;
  platformFeeAmount: number;
  netPayoutAmount: number;
  payoutMethod: string;
  payoutAccount: string;
  referenceNo?: string | null;
}) {
  const feePct = Math.round(platformFeeRate * 100);
  const body = `
    <p style="margin:0 0 14px;">Hi <strong style="color:#ffffff;">${escapeHtml(organizerName || 'Organizer')}</strong>,</p>
    <p style="margin:0 0 16px;">
      Great news! Your organizer online earnings settlement has been processed and marked <strong style="color:#32C77A;">SETTLED</strong>.
    </p>
    <div style="margin:16px 0;padding:16px 18px;border-radius:12px;background-color:#0f1916;border:1px solid #263931;">
      <p style="margin:0 0 6px;font-size:13px;color:#cbd7d1;"><strong>Gross Online Earnings:</strong> BDT ${grossAmount.toFixed(2)}</p>
      <p style="margin:0 0 6px;font-size:13px;color:#FF9F43;"><strong>Platform Fee (${feePct}%):</strong> - BDT ${platformFeeAmount.toFixed(2)}</p>
      <p style="margin:0 0 8px;font-size:15px;color:#B9F34A;"><strong>Net Settled Payout:</strong> BDT ${netPayoutAmount.toFixed(2)}</p>
      <p style="margin:0 0 4px;font-size:12px;color:#9baaa2;"><strong>Method:</strong> ${escapeHtml(payoutMethod)} (${escapeHtml(payoutAccount)})</p>
      ${referenceNo ? `<p style="margin:0;font-size:12px;color:#9baaa2;"><strong>Reference:</strong> ${escapeHtml(referenceNo)}</p>` : ''}
    </div>
  `;

  return {
    subject: `Payout Settled: BDT ${netPayoutAmount.toFixed(0)} Sent via ${payoutMethod}`,
    html: wrapEmailLayout('Organizer Earnings Settled', 'Payout Settled', body),
    text: `Hi ${organizerName}, your payout of BDT ${netPayoutAmount.toFixed(2)} (after ${feePct}% platform fee of BDT ${platformFeeAmount.toFixed(2)}) has been settled via ${payoutMethod} (${payoutAccount}).`,
  };
}
