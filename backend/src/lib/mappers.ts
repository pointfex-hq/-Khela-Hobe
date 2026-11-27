import { toEpoch } from './http';

export function toSportDto(s: {
  id: string;
  name: string;
  slug: string;
  iconUrl: string | null;
  description: string | null;
  playerCountMin: number | null;
  playerCountMax: number | null;
  active: boolean;
}) {
  return {
    id: s.id,
    name: s.name,
    slug: s.slug,
    iconUrl: s.iconUrl,
    description: s.description,
    playerCountMin: s.playerCountMin,
    playerCountMax: s.playerCountMax,
    active: s.active,
  };
}

export function toZoneDto(z: {
  id: string;
  name: string;
  division: string;
  city: string;
  area: string | null;
  latitude: number;
  longitude: number;
  zoom: number;
  active: boolean;
}) {
  return {
    id: z.id,
    name: z.name,
    label: z.name,
    division: z.division,
    city: z.city,
    area: z.area,
    sublabel: z.area ? `${z.area}, ${z.division}` : z.division,
    lat: z.latitude,
    lng: z.longitude,
    latitude: z.latitude,
    longitude: z.longitude,
    zoom: z.zoom ?? 13,
    active: z.active,
  };
}

export function toVenueDto(v: {
  id: string;
  name: string;
  venueType?: string;
  zoneId?: string | null;
  description?: string | null;
  facilities?: string | null;
  pricePerHour?: number | null;
  isTurf?: boolean;
  coverImageUrl?: string | null;
  active?: boolean;
  address: string;
  city: string;
  area: string | null;
  latitude: number;
  longitude: number;
}) {
  return {
    id: v.id,
    name: v.name,
    venueType: v.venueType ?? (v.isTurf ? 'TURF' : 'PLAYGROUND'),
    zoneId: v.zoneId ?? null,
    description: v.description ?? null,
    facilities: v.facilities ?? null,
    pricePerHour: v.pricePerHour ?? null,
    isTurf: v.isTurf ?? v.venueType === 'TURF',
    coverImageUrl: v.coverImageUrl ?? null,
    active: v.active ?? true,
    address: v.address,
    city: v.city,
    area: v.area,
    latitude: v.latitude,
    longitude: v.longitude,
  };
}

export function toTournamentDto(t: {
  id: string;
  title: string;
  sport: string;
  format: string;
  description: string;
  features?: string | null;
  rules: string | null;
  championPrize: string | null;
  runnerUpPrize: string | null;
  mvpPrize: string | null;
  prizePool: string | null;
  organizerId: string;
  venueName: string;
  city: string;
  area: string | null;
  latitude: number | null;
  longitude: number | null;
  startDate: string;
  time: string;
  duration: string;
  maxTeams: number;
  teamSize: number;
  entryFee: number;
  paymentMode?: string;
  requireTeamApproval?: boolean;
  spectatorMode?: string;
  spectatorCapacity?: number;
  ticketPrice?: number;
  vipTicketPrice?: number | null;
  coverImageUrl: string | null;
  bannerImages?: string[];
  standingsJson?: unknown;
  fixturesJson?: unknown;
  resultsJson?: unknown;
  status: string;
  moderationNote: string | null;
  createdAt: Date;
  organizer?: { id: string; fullName: string; profileImageUrl: string | null } | null;
  registrations?: Array<{ id: string; status?: string }>;
  interests?: Array<{ userId: string }>;
  tickets?: Array<{ id: string; status?: string }>;
}, viewerUserId?: string | null) {
  const activeRegistrations = t.registrations
    ? t.registrations.filter((r) => r.status !== 'REJECTED' && r.status !== 'PENDING_PAYMENT')
    : [];
  const activeTickets = t.tickets
    ? t.tickets.filter((tk) => tk.status !== 'CANCELLED')
    : [];
  const interestCount = t.interests ? t.interests.length : 0;
  const isInterested = Boolean(
    viewerUserId && t.interests?.some((i) => i.userId === viewerUserId)
  );
  const spectatorCapacity = t.spectatorCapacity ?? 0;
  const ticketsSold = activeTickets.length;

  const bannerList =
    Array.isArray(t.bannerImages) && t.bannerImages.length > 0
      ? t.bannerImages.slice(0, 4)
      : t.coverImageUrl
        ? [t.coverImageUrl]
        : [];

  return {
    id: t.id,
    title: t.title,
    sport: t.sport,
    format: t.format,
    description: t.description,
    features: t.features ?? null,
    rules: t.rules,
    championPrize: t.championPrize,
    runnerUpPrize: t.runnerUpPrize,
    mvpPrize: t.mvpPrize,
    prizePool: t.prizePool,
    organizerId: t.organizerId,
    organizer: t.organizer
      ? {
          id: t.organizer.id,
          name: t.organizer.fullName,
          avatar: t.organizer.profileImageUrl ?? null,
        }
      : null,
    venue: t.venueName,
    venueName: t.venueName,
    city: t.city,
    area: t.area || t.city,
    latitude: t.latitude,
    longitude: t.longitude,
    date: t.startDate,
    startDate: t.startDate,
    time: t.time,
    duration: t.duration,
    totalTeams: t.maxTeams,
    maxTeams: t.maxTeams,
    teamSize: t.teamSize,
    filledTeams: activeRegistrations.length,
    registeredTeams: activeRegistrations.length,
    fee: t.entryFee > 0 ? `BDT ${t.entryFee} / Team` : 'Free Entry',
    entryFee: t.entryFee,
    paymentMode: t.paymentMode || 'OPTIONAL_VENUE',
    requireTeamApproval: t.requireTeamApproval ?? true,
    spectatorMode: t.spectatorMode || 'OPEN_FREE',
    spectatorCapacity,
    ticketPrice: t.ticketPrice ?? 0,
    vipTicketPrice: t.vipTicketPrice ?? null,
    ticketsSold,
    remainingSeats:
      t.spectatorMode === 'LIMITED_TICKETS'
        ? Math.max(0, spectatorCapacity - ticketsSold)
        : null,
    interestCount,
    isInterested,
    image: bannerList[0] || t.coverImageUrl,
    coverImageUrl: bannerList[0] || t.coverImageUrl,
    bannerImages: bannerList,
    standings: Array.isArray(t.standingsJson) ? t.standingsJson : [],
    fixtures: Array.isArray(t.fixturesJson) ? t.fixturesJson : [],
    results: t.resultsJson && typeof t.resultsJson === 'object' ? t.resultsJson : null,
    status: t.status,
    moderationNote: t.moderationNote,
    createdAt: toEpoch(t.createdAt),
  };
}

export function toMatchDto(m: {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  locationName: string | null;
  locationAddress: string | null;
  city: string;
  area: string | null;
  startTime: Date;
  endTime: Date;
  capacity: number;
  status: string;
  joinMode: string;
  skillLevel: string | null;
  feeAmount: number;
  equipmentFee?: number;
  allowOnlinePayment?: boolean;
  coverImageUrl: string | null;
  rules: string | null;
  guardianRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
  sport: {
    id: string;
    name: string;
    slug: string;
    iconUrl: string | null;
    description: string | null;
    playerCountMin: number | null;
    playerCountMax: number | null;
    active: boolean;
  };
  organizer: {
    id: string;
    fullName: string;
    profileImageUrl: string | null;
  };
  venue?: {
    id: string;
    name: string;
    address: string;
    city: string;
    area: string | null;
    latitude: number;
    longitude: number;
  } | null;
  participants?: Array<{
    id?: string;
    userId?: string;
    status: string;
    joinedAt?: Date;
    user?: { fullName: string; profileImageUrl: string | null };
  }>;
  equipmentRequirements?: Array<{
    id: string;
    equipmentName: string;
    requiredQuantity: number;
    committedQuantity: number;
    contributions?: Array<{
      id: string;
      userId: string;
      quantity: number;
      user?: { id: string; fullName: string; profileImageUrl: string | null } | null;
    }>;
  }>;
}) {
  const confirmedCount = m.participants
    ? m.participants.filter((p) => p.status === 'CONFIRMED').length
    : 0;
  const availableSlots = Math.max(0, m.capacity - confirmedCount);
  const mode =
    m.joinMode === 'APPROVAL_REQUIRED' || m.joinMode === 'APPLICATION_REQUIRED'
      ? 'APPLICATION_REQUIRED'
      : 'INSTANT_JOIN';

  const mappedParticipants =
    m.participants && m.participants.some((p) => Boolean(p.userId))
      ? m.participants
          .filter((p) => Boolean(p.userId))
          .map((p) => ({
            id: p.id || `${p.userId}`,
            userId: p.userId as string,
            fullName: p.user?.fullName ?? 'Player',
            profileImageUrl: p.user?.profileImageUrl ?? null,
            status: p.status,
            joinedAt: toEpoch(p.joinedAt),
          }))
      : undefined;

  const mappedEquipment = Array.isArray(m.equipmentRequirements)
    ? m.equipmentRequirements.map((eq) => {
        const contributions = Array.isArray(eq.contributions) ? eq.contributions : [];
        const committed = contributions.length > 0
          ? contributions.reduce((sum, c) => sum + c.quantity, 0)
          : eq.committedQuantity ?? 0;
        return {
          id: eq.id,
          name: eq.equipmentName,
          required: eq.requiredQuantity,
          committed,
          remaining: Math.max(0, eq.requiredQuantity - committed),
          contributors: contributions.map((c) => ({
            id: c.id,
            userId: c.userId,
            name: c.user?.fullName || 'Player',
            avatar: c.user?.profileImageUrl ?? null,
            quantity: c.quantity,
          })),
        };
      })
    : [];

  return {
    id: m.id,
    title: m.title,
    description: m.description || null,
    sport: toSportDto(m.sport),
    organizer: {
      id: m.organizer.id,
      fullName: m.organizer.fullName,
      displayName: m.organizer.fullName,
      profileImageUrl: m.organizer.profileImageUrl ?? null,
    },
    venue: m.venue ? toVenueDto(m.venue) : null,
    location: {
      name: m.locationName || m.venue?.name || m.area || m.city,
      address: m.locationAddress || m.venue?.address || null,
      city: m.city,
      area: m.area,
      latitude: m.latitude,
      longitude: m.longitude,
    },
    startTime: toEpoch(m.startTime),
    endTime: toEpoch(m.endTime),
    capacity: m.capacity,
    confirmedCount,
    availableSlots,
    ...(mappedParticipants ? { participants: mappedParticipants } : {}),
    equipment: mappedEquipment,
    status: m.status,
    mode,
    skillLevel: m.skillLevel,
    feeAmount: m.feeAmount ?? 0,
    equipmentFee: m.equipmentFee ?? 0,
    totalVenueFee: Number(((m.feeAmount ?? 0) + (m.equipmentFee ?? 0)).toFixed(2)),
    allowOnlinePayment: m.allowOnlinePayment ?? true,
    coverImageUrl: m.coverImageUrl ?? null,
    rules: m.rules ?? null,
    guardianRequired: m.guardianRequired,
    createdAt: toEpoch(m.createdAt),
    updatedAt: toEpoch(m.updatedAt),
  };
}

export function toParticipantDto(p: {
  id: string;
  userId: string;
  status: string;
  joinedAt: Date;
  user: { fullName: string; profileImageUrl: string | null };
}) {
  return {
    id: p.id,
    userId: p.userId,
    fullName: p.user.fullName,
    profileImageUrl: p.user.profileImageUrl ?? null,
    status: p.status,
    joinedAt: toEpoch(p.joinedAt),
  };
}

export function toApplicationDto(a: {
  id: string;
  matchId: string;
  userId: string;
  message: string | null;
  status: string;
  reviewNote: string | null;
  rejectionReason: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
  match: { title: string };
  user: { fullName: string; profileImageUrl: string | null };
}) {
  return {
    id: a.id,
    matchId: a.matchId,
    matchTitle: a.match.title,
    applicantId: a.userId,
    applicantName: a.user.fullName,
    applicantProfileImageUrl: a.user.profileImageUrl ?? null,
    message: a.message ?? null,
    status: a.status,
    reviewNote: a.reviewNote ?? a.rejectionReason ?? null,
    createdAt: toEpoch(a.createdAt),
    reviewedAt: toEpoch(a.reviewedAt),
  };
}

export function toNotificationDto(n: {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: Date;
}) {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    actionUrl: n.link ?? null,
    read: n.read,
    createdAt: toEpoch(n.createdAt),
  };
}

export function toReportDto(r: {
  id: string;
  reporterId: string;
  targetType: string;
  targetId: string;
  targetName: string | null;
  reason: string | null;
  description: string;
  status: string;
  resolutionNote: string | null;
  rejectionReason: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
  reporter?: { fullName: string } | null;
}) {
  return {
    id: r.id,
    reporterId: r.reporterId,
    reporterName: r.reporter?.fullName ?? 'User',
    targetType: r.targetType,
    targetId: r.targetId,
    targetName: r.targetName ?? null,
    reason: r.reason ?? r.description,
    description: r.description,
    status: r.status,
    resolutionNote: r.resolutionNote ?? r.rejectionReason ?? null,
    createdAt: toEpoch(r.createdAt),
    resolvedAt: toEpoch(r.resolvedAt),
  };
}
