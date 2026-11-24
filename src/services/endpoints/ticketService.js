import apiClient from '../api/apiClient';

/**
 * Mock data store for Events and Ticket Tiers
 */
const MOCK_EVENT_TIERS = {
  evt_01: {
    eventId: 'evt_01',
    eventTitle: 'Dhaka Floodlit Futsal Cup 2026',
    sport: 'Football / Futsal',
    venue: 'Bashundhara Sports Complex',
    venueAddress: 'Block N, Bashundhara R/A, Dhaka',
    date: 'Fri, 28 Nov 2026',
    time: '4:00 PM – 10:00 PM BST',
    organizerName: 'Dhaka Amateur Sports League',
    currency: 'BDT',
    paymentNotice:
      'Online payment checkout is currently unavailable until payment gateway APIs are connected. You can preview ticket tiers below and reserve passes with pay-at-venue settlement.',
    tiers: [
      {
        id: 'tier_squad',
        name: 'Player Squad Pass',
        description: 'Full tournament entry + match jersey + hydration kit',
        price: 600,
        availableQuantity: 12,
        totalQuantity: 24,
        maxPerOrder: 5,
        badge: 'Recommended for Players',
      },
      {
        id: 'tier_spectator',
        name: 'Spectator Pass',
        description: 'Sideline seating for both knockout match days',
        price: 150,
        availableQuantity: 45,
        totalQuantity: 100,
        maxPerOrder: 8,
        badge: 'General Admission',
      },
      {
        id: 'tier_vip',
        name: 'VIP Hospitality Pass',
        description: 'Air-conditioned lounge access + refreshment buffet + priority seating',
        price: 1200,
        availableQuantity: 6,
        totalQuantity: 20,
        maxPerOrder: 2,
        badge: 'Limited Access',
      },
    ],
  },
  default: {
    eventId: 'evt_default',
    eventTitle: 'Dhaka Floodlit Futsal Cup 2026',
    sport: 'Football / Futsal',
    venue: 'Bashundhara Sports Complex',
    venueAddress: 'Block N, Bashundhara R/A, Dhaka',
    date: 'Fri, 28 Nov 2026',
    time: '4:00 PM BST',
    organizerName: 'Dhaka Amateur Sports League',
    currency: 'BDT',
    paymentNotice:
      'Online payment checkout is currently unavailable until payment gateway APIs are connected. You can preview ticket tiers below.',
    tiers: [
      {
        id: 'tier_squad',
        name: 'Player Squad Pass',
        description: 'Full tournament entry + match jersey + hydration',
        price: 600,
        availableQuantity: 12,
        totalQuantity: 20,
        maxPerOrder: 4,
      },
      {
        id: 'tier_spectator',
        name: 'Spectator Pass',
        description: 'Sideline seating for both knockout days',
        price: 150,
        availableQuantity: 45,
        totalQuantity: 100,
        maxPerOrder: 8,
      },
    ],
  },
};

/**
 * Initial Ticket Store
 */
let ticketsStore = [
  {
    id: 'KH-TKT-90841',
    eventId: 'evt_01',
    title: 'Dhaka Corporate Futsal Cup 2026',
    venue: 'Bashundhara Sports Complex',
    schedule: 'Fri, 28 Nov, 4:00 PM BST',
    status: 'Reserved Pass',
    paymentStatus: 'Pay at Venue (Online Payment Unavailable)',
    eventTier: 'Player Entry (1x)',
    tierId: 'tier_squad',
    fee: 'BDT 500',
    unitPrice: 500,
    quantity: 1,
    subtotal: 500,
    serviceFee: 0,
    totalPrice: 500,
    attendeeName: 'Tanvir Hasan',
    attendeePhone: '+880 1711-234567',
    attendeeEmail: 'tanvir@khelahobe.com',
    bookingDate: '24 Nov 2026, 8:40 PM',
    qrCode: 'KH-TKT-90841',
    isCheckedIn: false,
    checkInTime: null,
  },
  {
    id: 'KH-TKT-91204',
    eventId: 'evt_01',
    title: 'Dhaka Floodlit Futsal Cup 2026',
    venue: 'Bashundhara Sports Complex',
    schedule: 'Sat, 05 Dec, 6:00 PM BST',
    status: 'Reserved Pass',
    paymentStatus: 'Pay at Venue (Online Payment Unavailable)',
    eventTier: 'Player Squad Pass (1x)',
    tierId: 'tier_squad',
    fee: 'BDT 600',
    unitPrice: 600,
    quantity: 1,
    subtotal: 600,
    serviceFee: 0,
    totalPrice: 600,
    attendeeName: 'Tanvir Hasan',
    attendeePhone: '+880 1711-234567',
    attendeeEmail: 'tanvir@khelahobe.com',
    bookingDate: '22 Nov 2026, 2:15 PM',
    qrCode: 'KH-TKT-91204',
    isCheckedIn: false,
    checkInTime: null,
  },
  {
    id: 'KH-TKT-77412',
    eventId: 'evt_03',
    title: 'Uttara Autumn Badminton Open',
    venue: 'Uttara Indoor Complex',
    schedule: 'Sat, 1 Nov, 5:00 PM BST',
    status: 'Checked In',
    paymentStatus: 'Settled at Venue',
    eventTier: 'Single Entry (1x)',
    tierId: 'tier_spectator',
    fee: 'BDT 300',
    unitPrice: 300,
    quantity: 1,
    subtotal: 300,
    serviceFee: 0,
    totalPrice: 300,
    attendeeName: 'Tanvir Hasan',
    attendeePhone: '+880 1711-234567',
    attendeeEmail: 'tanvir@khelahobe.com',
    bookingDate: '28 Oct 2026, 11:00 AM',
    qrCode: 'KH-TKT-77412',
    isCheckedIn: true,
    checkInTime: '01 Nov 2026, 4:45 PM BST',
  },
  {
    id: 'KH-TKT-65129',
    eventId: 'evt_04',
    title: 'Dhanmondi 3v3 Basketball Showdown',
    venue: 'Dhanmondi Field 4',
    schedule: 'Sun, 18 Oct, 3:30 PM BST',
    status: 'Cancelled',
    paymentStatus: 'Reservation Void',
    eventTier: 'Spectator Pass (2x)',
    tierId: 'tier_spectator',
    fee: 'BDT 300',
    unitPrice: 150,
    quantity: 2,
    subtotal: 300,
    serviceFee: 0,
    totalPrice: 300,
    attendeeName: 'Tanvir Hasan',
    attendeePhone: '+880 1711-234567',
    attendeeEmail: 'tanvir@khelahobe.com',
    bookingDate: '14 Oct 2026, 6:20 PM',
    qrCode: 'KH-TKT-65129',
    isCheckedIn: false,
    checkInTime: null,
    cancellationReason: 'Reservation cancelled by player before kickoff deadline.',
  },
];

export const ticketService = {
  /**
   * Get available ticket tiers & pricing for an event
   */
  getAvailableTickets: async (eventId = 'evt_01') => {
    try {
      const response = await apiClient.get(`/events/${eventId}/tickets`);
      return response.data;
    } catch {
      const data = MOCK_EVENT_TIERS[eventId] || MOCK_EVENT_TIERS.evt_01;
      return {
        success: true,
        data: {
          ...data,
          eventId: eventId || data.eventId,
        },
      };
    }
  },

  /**
   * Mock ticket booking / reservation operation
   * Note: No payment gateway or real financial transactions
   */
  bookTicket: async (eventId, payload) => {
    try {
      const response = await apiClient.post(`/events/${eventId}/tickets/book`, payload);
      return response.data;
    } catch {
      const eventMeta = MOCK_EVENT_TIERS[eventId] || MOCK_EVENT_TIERS.evt_01;
      const selectedTier =
        eventMeta.tiers.find((t) => t.id === payload.tierId) || eventMeta.tiers[0];

      const quantity = Math.max(1, parseInt(payload.quantity || 1, 10));
      const subtotal = selectedTier.price * quantity;
      const randomCode = Math.floor(10000 + Math.random() * 90000);
      const ticketId = `KH-TKT-${randomCode}`;

      const newTicket = {
        id: ticketId,
        eventId: eventId || eventMeta.eventId,
        title: eventMeta.eventTitle,
        venue: eventMeta.venue,
        schedule: `${eventMeta.date}, ${eventMeta.time}`,
        status: 'Reserved Pass',
        paymentStatus: 'Pay at Venue (Online Payment Unavailable)',
        eventTier: `${selectedTier.name} (${quantity}x)`,
        tierId: selectedTier.id,
        fee: `BDT ${subtotal}`,
        unitPrice: selectedTier.price,
        quantity,
        subtotal,
        serviceFee: 0,
        totalPrice: subtotal,
        attendeeName: payload.attendeeName || 'Tanvir Hasan',
        attendeePhone: payload.attendeePhone || '+880 1711-234567',
        attendeeEmail: payload.attendeeEmail || 'tanvir@khelahobe.com',
        bookingDate: 'Just now',
        qrCode: ticketId,
        isCheckedIn: false,
        checkInTime: null,
        notes: payload.notes || '',
      };

      ticketsStore = [newTicket, ...ticketsStore];

      return {
        success: true,
        data: newTicket,
        message: 'Pass reservation confirmed! Present QR code at the venue gate for check-in.',
      };
    }
  },

  /**
   * Get all tickets / event passes for current user
   */
  getMyTickets: async () => {
    try {
      const response = await apiClient.get('/tickets/my');
      return response.data;
    } catch {
      return {
        success: true,
        data: [...ticketsStore],
        total: ticketsStore.length,
      };
    }
  },

  /**
   * Get details for a specific ticket
   */
  getTicketDetails: async (ticketId) => {
    try {
      const response = await apiClient.get(`/tickets/${ticketId}`);
      return response.data;
    } catch {
      const ticket = ticketsStore.find((t) => t.id.toLowerCase() === ticketId.toLowerCase());
      if (!ticket) {
        return {
          success: false,
          message: 'Ticket pass not found.',
          data: null,
        };
      }
      return {
        success: true,
        data: ticket,
      };
    }
  },

  /**
   * Verify ticket by ticket code or QR payload
   * Returns: VALID, INVALID, ALREADY_USED, or CANCELLED state
   */
  verifyTicket: async (ticketCode) => {
    try {
      const response = await apiClient.post('/tickets/verify', { code: ticketCode });
      return response.data;
    } catch {
      const cleanCode = (ticketCode || '').trim().toUpperCase();
      if (!cleanCode) {
        return {
          success: false,
          status: 'INVALID',
          message: 'Please enter a ticket code to verify.',
          data: null,
        };
      }

      const match = ticketsStore.find(
        (t) => t.id.toUpperCase() === cleanCode || t.qrCode.toUpperCase() === cleanCode
      );

      if (!match) {
        return {
          success: false,
          status: 'INVALID',
          message: `Ticket "${cleanCode}" was not found in the verified backend registry. Access denied.`,
          data: null,
          code: cleanCode,
        };
      }

      if (match.status === 'Cancelled') {
        return {
          success: false,
          status: 'CANCELLED',
          message: `Ticket ${match.id} was cancelled and is void for entry.`,
          data: match,
          code: cleanCode,
        };
      }

      if (match.isCheckedIn || match.status === 'Checked In') {
        return {
          success: false,
          status: 'ALREADY_USED',
          message: `Ticket ${match.id} has already been checked in at ${match.checkInTime || 'the gate'}. Duplicate entry rejected.`,
          data: match,
          code: cleanCode,
        };
      }

      return {
        success: true,
        status: 'VALID',
        message: `Verified: ${match.eventTier} for ${match.attendeeName}. Valid for gate entry.`,
        data: match,
        code: cleanCode,
      };
    }
  },

  /**
   * Check in attendee at the venue gate
   */
  checkInTicket: async (ticketId) => {
    try {
      const response = await apiClient.post(`/tickets/${ticketId}/check-in`);
      return response.data;
    } catch {
      const target = ticketsStore.find((t) => t.id.toUpperCase() === ticketId.toUpperCase());
      if (!target) {
        return {
          success: false,
          message: 'Ticket not found.',
        };
      }

      if (target.isCheckedIn) {
        return {
          success: false,
          message: 'Ticket has already been checked in.',
        };
      }

      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      target.isCheckedIn = true;
      target.status = 'Checked In';
      target.checkInTime = `Today, ${timeStr} BST`;

      return {
        success: true,
        data: { ...target },
        message: `Check-in confirmed for ${target.attendeeName}! Pass ${target.id} verified.`,
      };
    }
  },

  /**
   * Cancel / void ticket
   */
  cancelTicket: async (ticketId, reason = 'Cancelled by attendee') => {
    try {
      const response = await apiClient.post(`/tickets/${ticketId}/cancel`, { reason });
      return response.data;
    } catch {
      const target = ticketsStore.find((t) => t.id === ticketId);
      if (target) {
        target.status = 'Cancelled';
        target.paymentStatus = 'Reservation Void';
        target.cancellationReason = reason;
      }
      return {
        success: true,
        message: 'Reservation cancelled successfully.',
        data: target,
      };
    }
  },
};

export default ticketService;
