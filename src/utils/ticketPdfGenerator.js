import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

/**
 * Generates and downloads a sleek modern athletic sports pass PDF with an embedded scannable QR code.
 */
export async function downloadTicketPassPdf(ticket) {
  const passCode = ticket?.ticketCode || ticket?.id || 'KH-TKT-PASS';
  const qrPayload = JSON.stringify({
    code: passCode,
    tournamentId: ticket?.tournamentId || undefined,
    tier: ticket?.eventTier || ticket?.tierName || 'Spectator Pass',
  });

  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
    width: 360,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#0E1815', light: '#FFFFFF' },
  });

  // Landscape modern collectible ticket card (210mm x 110mm)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [210, 110],
  });

  // Outer pitch-dark backdrop
  doc.setFillColor(16, 26, 23); // #101A17
  doc.rect(0, 0, 210, 110, 'F');

  // Top & bottom subtle accent bars
  doc.setFillColor(185, 243, 74); // #B9F34A neon lime
  doc.rect(0, 0, 210, 3, 'F');
  doc.setFillColor(38, 134, 91); // #26865B emerald
  doc.rect(0, 107, 210, 3, 'F');

  // Elevated geometric left diagonal art stripe
  doc.setFillColor(27, 41, 35); // #1B2923 surface
  doc.roundedRect(6, 7, 198, 96, 4, 4, 'F');
  doc.setDrawColor(44, 59, 52);
  doc.setLineWidth(0.4);
  doc.roundedRect(6, 7, 198, 96, 4, 4, 'S');

  // Subtle decorative stadium pitch lines
  doc.setDrawColor(38, 134, 91);
  doc.setLineWidth(0.25);
  doc.circle(18, 92, 18, 'S');
  doc.line(12, 16, 136, 16);

  // Khela Hobe Brand Pill
  doc.setFillColor(185, 243, 74);
  doc.roundedRect(14, 13, 34, 7, 2, 2, 'F');
  doc.setTextColor(19, 31, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('KHELA HOBE PASS', 31, 17.8, { align: 'center' });

  // Tier Badge
  const tierLabel = String(ticket?.eventTier || ticket?.tierName || 'SPECTATOR PASS').toUpperCase();
  doc.setFillColor(35, 52, 45);
  doc.roundedRect(52, 13, 46, 7, 2, 2, 'F');
  doc.setTextColor(185, 243, 74);
  doc.setFontSize(7.5);
  doc.text(tierLabel.slice(0, 24), 75, 17.8, { align: 'center' });

  // Status Pill
  const statusLabel = String(ticket?.status || 'RESERVED').toUpperCase();
  doc.setFillColor(38, 134, 91);
  doc.roundedRect(102, 13, 30, 7, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.text(statusLabel.slice(0, 16), 117, 17.8, { align: 'center' });

  // Tournament / Event Title
  const title = String(ticket?.title || ticket?.eventTitle || 'Khela Hobe Tournament');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  const titleLines = doc.splitTextToSize(title, 122).slice(0, 2);
  doc.text(titleLines, 14, 30);

  // Venue & Schedule block
  const venueY = titleLines.length > 1 ? 45 : 39;
  doc.setTextColor(155, 170, 162);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(`VENUE: ${String(ticket?.venue || 'Authorized Venue, Bangladesh').slice(0, 48)}`, 14, venueY);
  doc.text(`SCHEDULE: ${String(ticket?.schedule || 'Upcoming Kickoff').slice(0, 48)}`, 14, venueY + 6);

  // Metadata Grid Box
  doc.setFillColor(16, 26, 23);
  doc.roundedRect(14, 58, 122, 28, 2.5, 2.5, 'F');
  doc.setDrawColor(44, 59, 52);
  doc.roundedRect(14, 58, 122, 28, 2.5, 2.5, 'S');

  doc.setTextColor(155, 170, 162);
  doc.setFontSize(7);
  doc.text('ATTENDEE', 18, 64);
  doc.text('FEE & SETTLEMENT', 78, 64);
  doc.text('OFFICIAL PASS CODE', 18, 76);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(String(ticket?.attendeeName || ticket?.userName || 'Verified Guest').slice(0, 28), 18, 69);

  const feeStr = `${ticket?.fee || 'Free Pass'} • ${ticket?.paymentStatus || 'Confirmed'}`;
  doc.text(feeStr.slice(0, 28), 78, 69);

  doc.setTextColor(185, 243, 74);
  doc.setFont('courier', 'bold');
  doc.setFontSize(11);
  doc.text(passCode, 18, 81.5);

  // Security tagline bottom left
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(155, 170, 162);
  doc.text('Present this QR pass at the venue entrance for live camera verification.', 14, 95);

  // Ticket Perforation Divider & Semicircle Notches
  doc.setDrawColor(70, 92, 82);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(143, 10, 143, 100);
  doc.setLineDashPattern([], 0);

  doc.setFillColor(16, 26, 23);
  doc.circle(143, 7, 3.5, 'F');
  doc.circle(143, 103, 3.5, 'F');

  // Right Stub: High-Contrast Scannable QR Frame
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(151, 18, 44, 44, 3, 3, 'F');
  doc.addImage(qrDataUrl, 'PNG', 153.5, 20.5, 39, 39);

  doc.setTextColor(255, 255, 255);
  doc.setFont('courier', 'bold');
  doc.setFontSize(8.5);
  doc.text(passCode, 173, 69.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(185, 243, 74);
  doc.text('SCAN AT GATE CHECK-IN', 173, 75, { align: 'center' });

  doc.setTextColor(155, 170, 162);
  doc.setFontSize(6.8);
  doc.text('Single-use verified pass', 173, 81, { align: 'center' });
  doc.text('Khela Hobe BD', 173, 95, { align: 'center' });

  doc.save(`KhelaHobe-Pass-${passCode}.pdf`);
}
