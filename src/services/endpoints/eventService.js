import apiClient from '../api/apiClient';

let eventsStore = [
  {
    id: 'evt_corp_cup',
    code: 'EVT-2026-01',
    title: 'Dhaka Corporate Futsal Cup 2026',
    sport: 'Football 7v7',
    format: 'Football 7v7 • Knockouts',
    venue: 'Bashundhara Sports Complex',
    area: 'Bashundhara R/A, Dhaka',
    date: 'Fri, 28 Nov 2026',
    time: '4:00 PM BST',
    duration: '6 Hours',
    status: 'Registration Open',
    registeredTeams: 18,
    totalTeams: 24,
    fee: 'BDT 3,500 / Team',
    paymentMode: 'Pay at venue check-in',
    description: '16-team weekend knockout tournament at Bashundhara Sports Complex. Includes certified referees, hydration stations, medical support, and live bracket updates.',
    organizerName: 'North Dhaka Sports Collective',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80',
    participants: [
      { id: 'ep_1', name: 'Pathao Strikers', captain: 'Farhan Ahmed', members: 8, status: 'Confirmed', checkedIn: false },
      { id: 'ep_2', name: 'Bkash Warriors', captain: 'Sadia Rahman', members: 7, status: 'Confirmed', checkedIn: false },
      { id: 'ep_3', name: 'Grameenphone XI', captain: 'Tariqul Islam', members: 8, status: 'Confirmed', checkedIn: false },
      { id: 'ep_4', name: 'Daraz United', captain: 'Kazi Arham', members: 7, status: 'Confirmed', checkedIn: false },
    ],
  },
  {
    id: 'evt_floodlit_cup',
    code: 'EVT-2026-02',
    title: 'Dhaka Floodlit Futsal Cup 2026',
    sport: 'Football 7v7',
    format: 'Football 7v7 • Knockouts',
    venue: 'Banani Central Turf, Dhaka',
    area: 'Banani, Dhaka',
    date: '28–29 Nov 2026',
    time: '5:00 PM – 10:00 PM (Asia/Dhaka)',
    duration: '2 Days',
    status: 'Registration Open',
    registeredTeams: 12,
    totalTeams: 16,
    fee: 'BDT 3,000 / Team',
    paymentMode: 'Pay at venue check-in',
    description: '16-team weekend knockout tournament at Banani Central Turf. Includes certified referees, hydration stations, and live bracket updates.',
    organizerName: 'Dhaka Turf League',
    image: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=800&auto=format&fit=crop&q=80',
    participants: [
      { id: 'ep_5', name: 'Gulshan Gladiators', captain: 'Tanvir Hasan', members: 8, status: 'Confirmed', checkedIn: false },
      { id: 'ep_6', name: 'Banani FC', captain: 'Rafiqul Islam', members: 7, status: 'Confirmed', checkedIn: false },
    ],
  },
  {
    id: 'evt_badminton_open',
    code: 'EVT-2026-00',
    title: 'Uttara Autumn Badminton Open',
    sport: 'Badminton',
    format: 'Badminton Doubles • Swiss System',
    venue: 'Uttara Indoor Complex',
    area: 'Sector 4, Uttara, Dhaka',
    date: 'Sat, 1 Nov 2026',
    time: '5:00 PM BST',
    duration: '5 Hours',
    status: 'Completed',
    registeredTeams: 32,
    totalTeams: 32,
    fee: 'BDT 1,000 / Pair',
    paymentMode: 'Completed',
    description: '32-player doubles championship with synthetic vinyl courts and Yonex feather shuttlecocks.',
    organizerName: 'North Dhaka Sports Collective',
    image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=80',
    participants: [
      { id: 'ep_7', name: 'Shuttle Smashers', captain: 'Arman Hossain', members: 2, status: 'Completed', checkedIn: true },
      { id: 'ep_8', name: 'Net Rulers', captain: 'Mehedi Hasan', members: 2, status: 'Completed', checkedIn: true },
    ],
  },
];

export const eventService = {
  /**
   * Get all organized events
   */
  getOrganizerEvents: async (statusFilter = 'all') => {
    try {
      const response = await apiClient.get('/events/organizer', { params: { status: statusFilter } });
      return response.data;
    } catch {
      let results = [...eventsStore];
      if (statusFilter && statusFilter !== 'all') {
        results = results.filter((e) => e.status.toLowerCase().includes(statusFilter.toLowerCase()));
      }
      return {
        success: true,
        data: results,
        total: results.length,
      };
    }
  },

  /**
   * Get event details by ID
   */
  getEventDetails: async (id) => {
    try {
      const response = await apiClient.get(`/events/${id}`);
      return response.data;
    } catch {
      const event = eventsStore.find((e) => e.id === id || e.code === id) || eventsStore[0];
      return {
        success: true,
        data: { ...event },
      };
    }
  },

  /**
   * Create tournament or event
   */
  createEvent: async (payload) => {
    try {
      const response = await apiClient.post('/events', payload);
      return response.data;
    } catch {
      const newEvent = {
        id: `evt_${Date.now()}`,
        code: `EVT-2026-${String(eventsStore.length + 1).padStart(2, '0')}`,
        title: payload.title || 'Untitled Sports Tournament',
        sport: payload.sport || 'Football',
        format: payload.format || 'Knockouts',
        venue: payload.venue || 'Dhaka Sports Arena',
        area: payload.area || 'Dhaka',
        date: payload.date || 'Upcoming',
        time: payload.time || '4:00 PM BST',
        duration: payload.duration || '6 Hours',
        status: 'Registration Open',
        registeredTeams: 1,
        totalTeams: parseInt(payload.totalTeams, 10) || 16,
        fee: payload.fee || 'BDT 3,000 / Team',
        paymentMode: 'Pay at venue check-in',
        description: payload.description || 'Community sports event.',
        organizerName: payload.organizerName || 'North Dhaka Sports Collective',
        image: payload.image || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80',
        participants: [],
      };
      eventsStore = [newEvent, ...eventsStore];
      return {
        success: true,
        data: newEvent,
        message: 'Event created and published successfully.',
      };
    }
  },

  /**
   * Update tournament or event
   */
  updateEvent: async (id, payload) => {
    try {
      const response = await apiClient.put(`/events/${id}`, payload);
      return response.data;
    } catch {
      const index = eventsStore.findIndex((e) => e.id === id);
      if (index !== -1) {
        eventsStore[index] = {
          ...eventsStore[index],
          ...payload,
        };
        return {
          success: true,
          data: eventsStore[index],
          message: 'Event updated successfully.',
        };
      }
      return { success: false, message: 'Event not found.' };
    }
  },

  /**
   * Get participants/teams of an event
   */
  getEventParticipants: async (id) => {
    try {
      const response = await apiClient.get(`/events/${id}/participants`);
      return response.data;
    } catch {
      const event = eventsStore.find((e) => e.id === id) || eventsStore[0];
      return {
        success: true,
        data: event.participants || [],
        total: (event.participants || []).length,
      };
    }
  },
};

export default eventService;
