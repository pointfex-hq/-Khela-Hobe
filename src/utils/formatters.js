/**
 * Formatting Utilities for Khela Hobe
 * Configured for Asia/Dhaka timezone and Bangladesh sports context.
 * Handles backend Instant epoch-seconds (float/number) and ISO-8601 strings.
 */

/**
 * Convert epoch seconds (e.g. 1795592504.589924), epoch ms, or ISO string to Date.
 */
export const toDate = (dateInput) => {
  if (dateInput === null || dateInput === undefined || dateInput === '') return null;
  if (dateInput instanceof Date) return Number.isNaN(dateInput.getTime()) ? null : dateInput;
  if (typeof dateInput === 'number') {
    // Backend sends Instant as epoch seconds (around 1.7e9); ms timestamps are > 1e12
    const ms = dateInput < 1e12 ? dateInput * 1000 : dateInput;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof dateInput === 'string' && /^\d+(\.\d+)?$/.test(dateInput.trim())) {
    const num = Number(dateInput.trim());
    const ms = num < 1e12 ? num * 1000 : num;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(dateInput);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const formatDateDhaka = (dateInput) => {
  const date = toDate(dateInput);
  if (!date) return '';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dhaka',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
};

export const formatTimeDhaka = (dateInput) => {
  const date = toDate(dateInput);
  if (!date) return '';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Dhaka',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
};

export const formatDateTimeDhaka = (dateInput) => {
  const date = toDate(dateInput);
  if (!date) return '';
  return `${formatDateDhaka(date)}, ${formatTimeDhaka(date)}`;
};

export const formatIsoDateDhaka = (dateInput) => {
  const date = toDate(dateInput);
  if (!date) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

export const formatCurrencyBDT = (amount) => {
  if (amount === null || amount === undefined || amount === 0 || amount === '0') return 'Free';
  return `৳${Number(amount).toLocaleString('en-BD')}`;
};

export const formatSlotCount = (filled, total) => {
  const remaining = Math.max(0, total - filled);
  return {
    filled,
    total,
    remaining,
    label: `${remaining} slots left`,
    ratio: `${filled} / ${total} players`,
  };
};

export const haversineDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (
    typeof lat1 !== 'number' ||
    typeof lon1 !== 'number' ||
    typeof lat2 !== 'number' ||
    typeof lon2 !== 'number'
  ) {
    return null;
  }
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
};
