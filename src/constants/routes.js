/**
 * Central Route Path Definitions
 */

export const ROUTES = {
  // Public
  HOME: '/',
  EXPLORE_MATCHES: '/explore',
  TOURNAMENTS: '/tournaments',
  MATCH_DETAILS: '/matches/:matchId',
  EVENT_DETAILS: '/events/:eventId',
  TICKET_BOOKING: '/events/:eventId/book',
  PAYMENT_STATUS: '/payment/status',
  DESIGN_SYSTEM: '/design-system',
  COMPONENTS: '/components',
  ABOUT: '/about',
  TERMS: '/terms',
  PRIVACY: '/privacy',

  // Auth
  LOGIN: '/login',
  REGISTER: '/register',
  GOOGLE_CALLBACK: '/auth/google/callback',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  // Player Workspace
  PLAYER_DASHBOARD: '/player/dashboard',
  PLAYER_EXPLORE: '/player/explore',
  PLAYER_MAP: '/player/map',
  PLAYER_MATCHES: '/player/my-matches',
  PLAYER_APPLICATIONS: '/player/applications',
  PLAYER_TICKETS: '/player/tickets',
  PLAYER_PROFILE: '/player/profile',
  PLAYER_PROFILE_EDIT: '/player/profile/edit',
  PUBLIC_PLAYER_PROFILE: '/players/:playerId',
  PLAYER_NOTIFICATIONS: '/player/notifications',

  // Organizer Workspace
  ORGANIZER_DASHBOARD: '/organizer/dashboard',
  CREATE_QUICK_MATCH: '/organizer/create-match',
  ORGANIZER_MATCHES: '/organizer/my-matches',
  ORGANIZER_EVENTS: '/organizer/events',
  ORGANIZER_EVENT_CREATE: '/organizer/events/create',
  ORGANIZER_EVENT_EDIT: '/organizer/events/:eventId/edit',
  ORGANIZER_EVENT_PARTICIPANTS: '/organizer/events/:eventId/participants',
  ORGANIZER_MATCH_MANAGEMENT: '/organizer/matches/:matchId',
  ORGANIZER_MATCH_EDIT: '/organizer/matches/:matchId/edit',
  ORGANIZER_APPLICATIONS: '/organizer/review-applications',
  ORGANIZER_MATCH_APPLICATIONS: '/organizer/matches/:matchId/applications',
  ORGANIZER_PARTICIPANTS: '/organizer/matches/:matchId/participants',
  ORGANIZER_CHECK_IN: '/organizer/ticket-check-in',
  ORGANIZER_EVENT_CHECK_IN: '/organizer/events/:eventId/check-in',
  ORGANIZER_EARNINGS: '/organizer/earnings',
  ORGANIZER_PROFILE: '/organizer/profile',
  ORGANIZER_PROFILE_EDIT: '/organizer/profile/edit',
  PUBLIC_ORGANIZER_PROFILE: '/organizers/:organizerId',

  // Guardian Workspace
  GUARDIAN_DASHBOARD: '/guardian/dashboard',
  GUARDIAN_CHILDREN: '/guardian/linked-children',
  GUARDIAN_CHILD_ACTIVITY: '/guardian/child-activity',
  GUARDIAN_CHILD_ACTIVITY_DETAIL: '/guardian/children/:childId/activity',
  GUARDIAN_SAFETY: '/guardian/safety-settings',
  GUARDIAN_ALERTS: '/guardian/safety-alerts',

  // Admin Workspace
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USERS: '/admin/users',
  ADMIN_MODERATION: '/admin/match-moderation',
  ADMIN_TOURNAMENTS: '/admin/tournaments',
  ADMIN_AUDIT_LOGS: '/admin/audit-logs',
  ADMIN_SETTLEMENTS: '/admin/settlements',
  ADMIN_SPORTS: '/admin/sports',
  ADMIN_LOCATIONS: '/admin/locations',
  ADMIN_REPORTS: '/admin/reports',

  // Fallbacks
  UNAUTHORIZED: '/unauthorized',
  NOT_FOUND: '*',
};
