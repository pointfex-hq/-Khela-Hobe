import { childService } from './childService';
import { safetyService } from './safetyService';

export const guardianService = {
  /**
   * Get aggregated Guardian Dashboard data from /guardian/children and /guardian/alerts
   */
  getGuardianDashboard: async () => {
    const [childrenRes, alertsRes] = await Promise.all([
      childService.getLinkedChildren(),
      safetyService.getSafetyAlerts(),
    ]);

    const children = childrenRes.data || [];
    const alerts = alertsRes.data || [];

    const verifiedChildren = children.filter((c) => c.status === 'Authorized' || c.isVerified);
    const pendingChildren = children.filter((c) => c.status !== 'Authorized' && !c.isVerified);
    const unreadAlerts = alerts.filter((a) => a.unread);

    return {
      success: true,
      data: {
        metrics: {
          linkedCount: verifiedChildren.length,
          linkedLabel: `${verifiedChildren.length} Verified`,
          linkedSubtext: 'All safety permissions active',
          pendingCount: pendingChildren.length,
          pendingLabel: `${pendingChildren.length}`,
          pendingSubtext: 'Awaiting child & backend verification',
          unreadAlerts: unreadAlerts.length,
          unreadLabel: `${unreadAlerts.length}`,
          unreadSubtext: 'Protected previews enabled',
        },
        authorizedChildren: verifiedChildren,
        pendingRequests: pendingChildren,
        recentAlerts: alerts.slice(0, 4),
        privacyNotice:
          'Only verified guardian relationships can view linked child activity. A Safety ID initiates linking and is never an authorization credential on its own.',
      },
    };
  },

  getLinkedChildren: childService.getLinkedChildren,
  getSafetyAlerts: safetyService.getSafetyAlerts,
};

export default guardianService;
