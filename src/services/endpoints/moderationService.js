import apiClient from '../api/apiClient';

let moderationMatchesStore = [
  {
    id: 'KH-M-4099',
    title: 'Mirpur 10 Late-Night Turf',
    sport: 'Football 7v7',
    venue: 'Mirpur 10 Turf Cages, Dhaka',
    schedule: 'Today, 10:30 PM BST',
    organizerName: 'Tariqul Hasan',
    organizerId: 'USR-0812',
    status: 'Flagged',
    reportsCount: 2,
    flagReason: 'Venue lighting outage & unverified fee change',
    description: 'Casual 7v7 night session. Participants reported floodlight failures and cash surcharge demands.',
    rosterCount: '12 / 14',
    dateCreated: 'Today, 2:15 PM BST',
  },
  {
    id: 'KH-M-4082',
    title: 'Banani Floodlit 7v7 Futsal',
    sport: 'Football 7v7',
    venue: 'Banani Block F Turf, Dhaka',
    schedule: 'Today, 7:30 PM BST',
    organizerName: 'Tanvir Hasan',
    organizerId: 'USR-1042',
    status: 'Published',
    reportsCount: 0,
    flagReason: null,
    description: 'Competitive friendly match on certified AstroTurf. Bibs and water provided.',
    rosterCount: '14 / 14 (Full)',
    dateCreated: 'Today, 11:00 AM BST',
  },
  {
    id: 'KH-M-3911',
    title: 'Uttara Sector 4 Badminton Doubles',
    sport: 'Badminton',
    venue: 'Sector 4 Indoor Complex, Dhaka',
    schedule: 'Tomorrow, 5:00 PM BST',
    organizerName: 'Mahmudul Karim',
    organizerId: 'USR-0921',
    status: 'Suspended',
    reportsCount: 3,
    flagReason: 'Listed venue closed for maintenance',
    description: 'Doubles match listed while the hall was officially scheduled for floor retarring.',
    rosterCount: '4 / 4',
    dateCreated: 'Yesterday, 4:00 PM BST',
  },
  {
    id: 'KH-M-4105',
    title: 'Dhanmondi Night Box Cricket',
    sport: 'Cricket',
    venue: 'Dhanmondi Club Turf, Dhaka',
    schedule: 'Fri, 28 Nov, 8:00 PM BST',
    organizerName: 'Shahriar Kabir',
    organizerId: 'USR-0752',
    status: 'Flagged',
    reportsCount: 1,
    flagReason: 'Unregistered host profile flag',
    description: 'Tape-ball cricket tournament. Host account flagged for verification discrepancy.',
    rosterCount: '8 / 16',
    dateCreated: '24 Nov 2026, 9:00 PM BST',
  },
];

export const moderationService = {
  /**
   * Get matches with moderation states and safety reports
   */
  getPendingMatches: async (filters = {}) => {
    try {
      const response = await apiClient.get('/admin/matches/moderation', { params: filters });
      return response.data;
    } catch {
      let results = [...moderationMatchesStore];
      const { search, sport, status } = filters;

      if (search && search.trim()) {
        const query = search.trim().toLowerCase();
        results = results.filter(
          (m) =>
            m.title.toLowerCase().includes(query) ||
            m.id.toLowerCase().includes(query) ||
            m.venue.toLowerCase().includes(query) ||
            m.organizerName.toLowerCase().includes(query)
        );
      }

      if (sport && sport !== 'All Sports') {
        results = results.filter((m) => m.sport.toLowerCase().includes(sport.toLowerCase()));
      }

      if (status && status !== 'All Matches') {
        if (status === 'Flagged Only') {
          results = results.filter((m) => m.status === 'Flagged');
        } else {
          results = results.filter((m) => m.status.toLowerCase() === status.toLowerCase());
        }
      }

      return {
        success: true,
        data: results,
        total: results.length,
      };
    }
  },

  /**
   * Perform moderation action on a match
   */
  moderateMatch: async (id, payload) => {
    try {
      const response = await apiClient.post(`/admin/matches/${id}/moderate`, payload);
      return response.data;
    } catch {
      const match = moderationMatchesStore.find((m) => m.id === id);
      if (match) {
        if (payload.action === 'suspend') {
          match.status = 'Suspended';
        } else if (payload.action === 'approve' || payload.action === 'dismiss_reports') {
          match.status = 'Published';
          match.reportsCount = 0;
          match.flagReason = null;
        } else if (payload.action === 'flag') {
          match.status = 'Flagged';
        }
      }

      return {
        success: true,
        data: match,
        message: `Match ${id} action "${payload.action}" applied successfully.`,
      };
    }
  },
};

export default moderationService;
