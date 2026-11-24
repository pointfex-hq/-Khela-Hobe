/**
 * Formatting Utilities for Khela Hobe
 * Configured for Asia/Dhaka timezone and Bangladesh sports context
 */

export const formatDateDhaka = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dhaka',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
};

export const formatTimeDhaka = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Dhaka',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
};

export const formatCurrencyBDT = (amount) => {
  if (amount === 0 || amount === '0') return 'Free';
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
