import { formatDateDhaka, formatTimeDhaka, formatIsoDateDhaka, formatDateTimeDhaka } from './formatters';

/**
 * Unwrap one level of the standard backend ApiResponse<T> envelope:
 * { success: true, data: T, timestamp: number }
 */
export function unwrapEnvelope(axiosResponse) {
  const body = axiosResponse?.data ?? axiosResponse;
  if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
    return body.data;
  }
  return body;
}

const SKILL_DISPLAY_MAP = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
  PROFESSIONAL: 'Competitive',
};

const SKILL_BACKEND_MAP = {
  beginner: 'BEGINNER',
  recreational: 'BEGINNER',
  'all levels': 'BEGINNER',
  'any level': 'BEGINNER',
  casual: 'BEGINNER',
  intermediate: 'INTERMEDIATE',
  advanced: 'ADVANCED',
  competitive: 'PROFESSIONAL',
  professional: 'PROFESSIONAL',
};

export function toBackendSkillLevel(label) {
  if (!label) return 'INTERMEDIATE';
  const upper = String(label).toUpperCase();
  if (['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PROFESSIONAL'].includes(upper)) {
    return upper;
  }
  return SKILL_BACKEND_MAP[String(label).toLowerCase().trim()] || 'INTERMEDIATE';
}

export function toDisplaySkillLevel(code) {
  if (!code) return 'All Levels';
  return SKILL_DISPLAY_MAP[String(code).toUpperCase()] || code;
}

/**
 * Normalize backend UserDto into a shape compatible with all UI components
 * while preserving exact backend DTO fields.
 */
export function normalizeUser(u) {
  if (!u || typeof u !== 'object') return null;
  const roles = Array.isArray(u.roles) && u.roles.length > 0
    ? u.roles
    : u.role
      ? [u.role]
      : ['PLAYER'];
  const primaryRole = u.role || roles[0] || 'PLAYER';

  return {
    ...u,
    name: u.name || u.fullName || '',
    fullName: u.fullName || u.name || '',
    role: primaryRole,
    roles,
    avatar: u.avatar ?? u.profileImageUrl ?? null,
    profileImageUrl: u.profileImageUrl ?? u.avatar ?? null,
    phone: u.phone ?? u.phoneNumber ?? '',
    phoneNumber: u.phoneNumber ?? u.phone ?? '',
    emailVerified: Boolean(u.emailVerified),
    parentalControlEnabled: Boolean(u.parentalControlEnabled),
    organizerApprovalStatus: u.organizerApprovalStatus ?? 'NONE',
    organizerApprovalNote: u.organizerApprovalNote ?? null,
    isVerifiedOrganizer: Boolean(u.isVerifiedOrganizer || u.organizerApprovalStatus === 'APPROVED'),
    quickMatchHostEnabled: Boolean(u.quickMatchHostEnabled),
    canApplyForOrganizer: Boolean(u.canApplyForOrganizer),
    organizerEligibilityThreshold: u.organizerEligibilityThreshold ?? 3,
    skillLevel: u.skillLevel || toDisplaySkillLevel(u.primarySkillLevel),
    status: u.status || (u.active === false ? 'Suspended' : 'Active'),
  };
}

/**
 * Normalize backend MatchDto into the UI shape used across MatchCard, Explore, Details, MapView, etc.
 */
export function normalizeMatch(m) {
  if (!m || typeof m !== 'object') return null;
  // If it's already a mock-formatted match without backend nested objects, ensure consistent fields
  const isBackendShape = Boolean(m.location || (m.sport && typeof m.sport === 'object') || typeof m.startTime === 'number');
  if (!isBackendShape) {
    return m;
  }

  const sportName = typeof m.sport === 'object' ? m.sport?.name : m.sport || 'Football';
  const sportSlug = typeof m.sport === 'object' ? m.sport?.slug : undefined;
  const sportId = typeof m.sport === 'object' ? m.sport?.id : m.sportId;

  const capacity = m.capacity ?? m.totalSlots ?? 10;
  const confirmedCount = m.confirmedCount ?? m.filledSlots ?? 0;
  const availableSlots = m.availableSlots ?? Math.max(0, capacity - confirmedCount);

  const backendStatus = String(m.status || 'OPEN').toUpperCase();
  const backendMode = String(m.mode || 'INSTANT_JOIN').toUpperCase();

  let joinMode = 'Open Join';
  if (backendStatus === 'FULL' || availableSlots <= 0) {
    joinMode = 'Match Full';
  } else if (backendMode === 'APPLICATION_REQUIRED') {
    joinMode = 'Approval Required';
  }

  let state = 'open';
  if (backendStatus === 'CANCELLED' || backendStatus === 'EXPIRED') state = 'cancelled';
  else if (backendStatus === 'COMPLETED') state = 'completed';
  else if (backendStatus === 'IN_PROGRESS') state = 'in-progress';
  else if (backendStatus === 'FULL' || availableSlots <= 0) state = 'full';

  const dateFormatted = formatDateDhaka(m.startTime);
  const startTimeFormatted = formatTimeDhaka(m.startTime);
  const endTimeFormatted = formatTimeDhaka(m.endTime);
  const timeRange = endTimeFormatted
    ? `${startTimeFormatted} – ${endTimeFormatted}`
    : startTimeFormatted;
  const schedule = dateFormatted ? `${dateFormatted}, ${timeRange}` : timeRange;

  const loc = m.location || {};
  const organizerObj = m.organizer
    ? {
        ...m.organizer,
        name: m.organizer.displayName || m.organizer.fullName || m.organizer.name || 'Organizer',
        avatar: m.organizer.profileImageUrl ?? m.organizer.avatar ?? null,
      }
    : null;

  return {
    ...m,
    sport: sportName,
    sportId,
    sportCategory: sportSlug || sportName,
    sportDto: typeof m.sport === 'object' ? m.sport : null,
    venue: m.venue?.name || loc.name || m.venue || 'Local Turf',
    venueDto: m.venue || null,
    area: loc.area || m.venue?.area || loc.city || m.area || 'Dhaka',
    city: loc.city || m.venue?.city || m.city || 'Dhaka',
    coordinates: {
      lat: loc.latitude ?? m.venue?.latitude ?? 23.8103,
      lng: loc.longitude ?? m.venue?.longitude ?? 90.4125,
      label: loc.area || loc.city || 'Dhaka',
    },
    date: formatIsoDateDhaka(m.startTime) || '',
    time: timeRange,
    timeDisplay: schedule,
    schedule,
    totalSlots: capacity,
    filledSlots: confirmedCount,
    availableSlots,
    skillLevel: toDisplaySkillLevel(m.skillLevel),
    joinMode,
    mode: backendMode,
    state,
    status: backendStatus,
    fee: m.feeAmount ?? m.fee ?? 0,
    feeAmount: m.feeAmount ?? m.fee ?? 0,
    equipmentFee: m.equipmentFee ?? 0,
    totalVenueFee: m.totalVenueFee ?? ((m.feeAmount ?? m.fee ?? 0) + (m.equipmentFee ?? 0)),
    allowOnlinePayment: m.allowOnlinePayment ?? true,
    organizer: organizerObj,
    organizerName: organizerObj?.name || 'Organizer',
    image: m.coverImageUrl || m.image || '/src/assets/images/futsal_night.jpg',
    surfaceType: m.venue?.address || loc.address || m.surfaceType || 'Verified local sports venue',
    equipment: Array.isArray(m.equipment) ? m.equipment : [],
    participants: Array.isArray(m.participants) ? m.participants.map(normalizeParticipant) : [],
  };
}

export function normalizeParticipant(p) {
  if (!p || typeof p !== 'object') return p;
  return {
    ...p,
    name: p.name || p.fullName || 'Player',
    fullName: p.fullName || p.name || 'Player',
    avatar: p.avatar ?? p.profileImageUrl ?? null,
    profileImageUrl: p.profileImageUrl ?? p.avatar ?? null,
    joinedAt: typeof p.joinedAt === 'number' ? formatDateTimeDhaka(p.joinedAt) : p.joinedAt,
    checkedIn: p.checkedIn ?? (p.status === 'CHECKED_IN' || p.status === 'ATTENDED'),
    role: p.role || 'Player',
    skill: p.skill || 'Intermediate',
  };
}

export function normalizeApplication(a) {
  if (!a || typeof a !== 'object') return a;
  const rawStatus = String(a.status || 'PENDING').toUpperCase();
  const statusMap = {
    PENDING: 'pending',
    APPROVED: 'accepted',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
    WITHDRAWN: 'withdrawn',
    CANCELLED: 'withdrawn',
  };

  return {
    ...a,
    name: a.applicantName || a.name,
    applicantName: a.applicantName || a.name || 'Applicant',
    avatar: a.applicantProfileImageUrl ?? a.avatar ?? null,
    status: statusMap[rawStatus] || rawStatus.toLowerCase(),
    rawStatus,
    playerNote: a.message ?? a.playerNote ?? null,
    note: a.message ?? a.note ?? null,
    organizerNote: a.reviewNote ?? a.organizerNote ?? null,
    appliedAt: typeof a.createdAt === 'number' ? formatDateTimeDhaka(a.createdAt) : a.appliedAt || '',
    sport: a.sport || 'Match',
    area: a.area || 'Dhaka',
    date: a.date || '',
    time: a.time || '',
    organizerName: a.organizerName || 'Organizer',
  };
}

export function normalizeNotification(n) {
  if (!n || typeof n !== 'object') return n;
  const typeLower = String(n.type || '').toLowerCase();
  let category = n.category || 'system';
  if (!n.category) {
    if (typeLower.includes('application')) category = 'applications';
    else if (typeLower.includes('safety') || typeLower.includes('guardian')) category = 'safety';
    else if (typeLower.includes('match')) category = 'matches';
  }
  return {
    ...n,
    category,
    time: n.time || (typeof n.createdAt === 'number' ? formatDateTimeDhaka(n.createdAt) : ''),
  };
}

export function normalizeGuardianLink(link) {
  if (!link || typeof link !== 'object') return link;
  const isVerified = link.status === 'ACTIVE' || Boolean(link.isVerified);
  return {
    ...link,
    id: link.childId || link.id,
    linkId: link.id,
    name: link.childDisplayName || link.name || 'Linked Child',
    status: isVerified ? 'Authorized' : link.status === 'REVOKED' ? 'Revoked' : 'Pending Verification',
    isVerified,
    createdAtFormatted: typeof link.createdAt === 'number' ? formatDateDhaka(link.createdAt) : '',
  };
}

export function normalizeSafetyAlert(alert) {
  if (!alert || typeof alert !== 'object') return alert;
  const isUnread = alert.unread !== undefined ? alert.unread : !alert.read;
  const cat = alert.category || String(alert.type || 'participation').toLowerCase();
  return {
    ...alert,
    unread: isUnread,
    read: !isUnread,
    category: cat,
    description: alert.description ?? alert.message ?? '',
    timestamp: alert.timestamp || (typeof alert.createdAt === 'number' ? formatDateTimeDhaka(alert.createdAt) : ''),
  };
}

export function normalizeReport(r) {
  if (!r || typeof r !== 'object') return r;
  const rawStatus = String(r.status || 'PENDING').toUpperCase();
  const statusDisplay =
    rawStatus === 'RESOLVED' ? 'Resolved' : rawStatus === 'DISMISSED' ? 'Rejected' : 'Pending';
  return {
    ...r,
    category: r.category || r.targetType || 'Report',
    matchId: r.matchId || r.targetId,
    matchTitle: r.matchTitle || r.targetName || r.targetId,
    details: r.details || r.description || r.reason,
    timestamp: r.timestamp || (typeof r.createdAt === 'number' ? formatDateTimeDhaka(r.createdAt) : ''),
    status: statusDisplay,
    rawStatus,
    severity: r.severity || 'Medium',
    evidenceCount: r.evidenceCount ?? 0,
  };
}

export function normalizeSport(s) {
  if (!s || typeof s !== 'object') return s;
  const slug = String(s.slug || s.name || '').toLowerCase();
  let iconKey = s.iconKey || 'futbol';
  if (!s.iconKey) {
    if (slug.includes('cricket')) iconKey = 'baseball';
    else if (slug.includes('basketball')) iconKey = 'basketball';
    else if (slug.includes('badminton') || slug.includes('tennis')) iconKey = 'table-tennis-paddle-ball';
  }
  return {
    ...s,
    iconKey,
    formats: s.formats || (s.playerCountMin && s.playerCountMax ? `${s.playerCountMin}–${s.playerCountMax} players` : 'Standard'),
    defaultCapacity: s.defaultCapacity ?? s.playerCountMax ?? 10,
    status: s.status || (s.active === false ? 'Inactive' : 'Active'),
  };
}
