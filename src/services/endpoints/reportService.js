import apiClient from '../api/apiClient';

let reportsStore = [
  {
    id: 'R-209',
    category: 'Misleading Venue',
    matchId: 'KH-3911',
    matchTitle: 'Uttara Sector 4 Badminton Doubles',
    reporterName: 'Mahmudul Karim',
    reporterId: 'USR-0921',
    timestamp: 'Today, 1:40 PM BST',
    status: 'Pending',
    reason: 'Listed venue was closed for turf maintenance.',
    details:
      'The host posted Sector 4 Indoor Complex court 2 for 5 PM, but complex administration confirmed all courts are locked for scheduled wooden floor sanding until Sunday.',
    evidenceCount: 1,
    severity: 'High',
  },
  {
    id: 'R-208',
    category: 'Unverified Fee Change',
    matchId: 'KH-4099',
    matchTitle: 'Mirpur 10 Late-Night Turf',
    reporterName: 'Ashikur Rahman',
    reporterId: 'USR-1102',
    timestamp: 'Today, 11:20 AM BST',
    status: 'Pending',
    reason: 'Organizer demanded BDT 200 cash surcharge at the pitch gate.',
    details:
      'The match was listed as BDT 150 per head in the app, but upon arriving the organizer insisted on BDT 350 stating floodlight charges were not included in listing.',
    evidenceCount: 2,
    severity: 'High',
  },
  {
    id: 'R-207',
    category: 'Match No-Show',
    matchId: 'KH-4050',
    matchTitle: 'Mohammadpur 5v5 Friendly',
    reporterName: 'Zayan Ahmed',
    reporterId: 'USR-1014',
    timestamp: 'Yesterday, 8:15 PM BST',
    status: 'Pending',
    reason: 'Host did not arrive with the booked equipment and balls.',
    details: 'Twelve players waited 45 minutes; organizer did not pick up phone or provide match bibs.',
    evidenceCount: 0,
    severity: 'Medium',
  },
  {
    id: 'R-206',
    category: 'Safety Hazard',
    matchId: 'KH-3882',
    matchTitle: 'Gulshan Youth Turf League',
    reporterName: 'Nusrat Jahan',
    reporterId: 'USR-1189',
    timestamp: '22 Nov 2026, 4:00 PM BST',
    status: 'Resolved',
    reason: 'Broken floodlight pole wires exposed near corner quadrant.',
    details:
      'Organizer addressed turf management immediately; hazard isolated and repaired with photo proof submitted.',
    evidenceCount: 3,
    severity: 'Critical',
    resolutionNote: 'Venue management inspected and repaired by municipal electrician.',
  },
  {
    id: 'R-205',
    category: 'Aggressive Behavior',
    matchId: 'KH-3810',
    matchTitle: 'Dhanmondi Weekend Box Cricket',
    reporterName: 'Imtiaz Hossain',
    reporterId: 'USR-0899',
    timestamp: '20 Nov 2026, 6:30 PM BST',
    status: 'Rejected',
    reason: 'Disputed umpire lbw decision escalation.',
    details:
      'Review of field reports and team captains confirmed it was standard gameplay banter without physical aggression.',
    evidenceCount: 1,
    severity: 'Low',
    resolutionNote: 'Report dismissed after captain arbitration.',
  },
];

export const reportService = {
  /**
   * Get all reports with optional filtering
   */
  getReports: async (filters = {}) => {
    try {
      const response = await apiClient.get('/admin/reports', { params: filters });
      return response.data;
    } catch {
      let results = [...reportsStore];
      const { category, status, search } = filters;

      if (search && search.trim()) {
        const query = search.trim().toLowerCase();
        results = results.filter(
          (r) =>
            r.id.toLowerCase().includes(query) ||
            r.matchId.toLowerCase().includes(query) ||
            r.matchTitle.toLowerCase().includes(query) ||
            r.reporterName.toLowerCase().includes(query) ||
            r.reason.toLowerCase().includes(query)
        );
      }

      if (category && category !== 'All Categories') {
        results = results.filter(
          (r) => r.category.toLowerCase() === category.toLowerCase()
        );
      }

      if (status && status !== 'All Statuses') {
        results = results.filter(
          (r) => r.status.toLowerCase() === status.toLowerCase()
        );
      }

      return {
        success: true,
        data: results,
        total: results.length,
        pendingCount: reportsStore.filter((r) => r.status === 'Pending').length,
      };
    }
  },

  /**
   * Review, resolve, or reject a safety/moderation report
   */
  reviewReport: async (id, payload) => {
    try {
      const response = await apiClient.post(`/admin/reports/${id}/review`, payload);
      return response.data;
    } catch {
      const report = reportsStore.find((r) => r.id === id);
      if (report) {
        if (payload.action === 'resolve') {
          report.status = 'Resolved';
          report.resolutionNote = payload.note || 'Resolved by moderator.';
        } else if (payload.action === 'reject') {
          report.status = 'Rejected';
          report.resolutionNote = payload.note || 'Report rejected after investigation.';
        } else if (payload.action === 'investigate') {
          report.status = 'Under Investigation';
        }
      }
      return {
        success: true,
        data: report,
        message: `Report #${id} marked as ${report?.status}.`,
      };
    }
  },
};

export default reportService;
