import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faTicket,
  faCreditCard,
  faTriangleExclamation,
  faCircleCheck,
  faLocationDot,
  faCalendarDays,
  faClock,
  faPlus,
  faMinus,
  faUser,
  faPhone,
  faEnvelope,
  faQrcode,
  faBuildingColumns,
} from '@fortawesome/free-solid-svg-icons';
import { ticketService } from '../../services/endpoints/ticketService';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';
import { toastService } from '../../components/feedback/toastService';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import Modal from '../../components/modals/Modal';

export const TicketBookingPage = () => {
  const { eventId = 'evt_01' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState(null);
  const [selectedTierId, setSelectedTierId] = useState('tier_squad');
  const [quantities, setQuantities] = useState({
    tier_squad: 1,
    tier_spectator: 0,
    tier_vip: 0,
  });

  // Attendee information
  const [attendeeName, setAttendeeName] = useState(user?.name || 'Tanvir Hasan');
  const [attendeePhone, setAttendeePhone] = useState(user?.phone || '+880 1711-234567');
  const [attendeeEmail, setAttendeeEmail] = useState(user?.email || 'tanvir@khelahobe.com');
  const [submitting, setSubmitting] = useState(false);

  // Booking confirmation modal
  const [confirmedTicket, setConfirmedTicket] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchTiers = async () => {
      try {
        setLoading(true);
        const res = await ticketService.getAvailableTickets(eventId);
        if (isMounted && res.success) {
          setEventData(res.data);
          if (res.data.tiers && res.data.tiers.length > 0) {
            setSelectedTierId(res.data.tiers[0].id);
            setQuantities({
              [res.data.tiers[0].id]: 1,
            });
          }
        }
      } catch (err) {
        console.error('Failed to load ticket tiers:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTiers();
    return () => {
      isMounted = false;
    };
  }, [eventId]);

  const handleSelectTier = (tierId) => {
    setSelectedTierId(tierId);
    if (!quantities[tierId] || quantities[tierId] === 0) {
      setQuantities((prev) => ({
        ...prev,
        [tierId]: 1,
      }));
    }
  };

  const handleQuantityChange = (tierId, delta, maxPerOrder, available) => {
    setQuantities((prev) => {
      const current = prev[tierId] || 0;
      const next = current + delta;
      const upperLimit = Math.min(maxPerOrder || 5, available || 10);
      if (next < 1) return prev; // keep at least 1 if selected
      if (next > upperLimit) {
        toastService.info(`Maximum ${upperLimit} tickets allowed per reservation.`);
        return prev;
      }
      return {
        ...prev,
        [tierId]: next,
      };
    });
  };

  const selectedTier =
    eventData?.tiers?.find((t) => t.id === selectedTierId) || eventData?.tiers?.[0];
  const selectedQty = quantities[selectedTier?.id] || 1;
  const subtotal = (selectedTier?.price || 0) * selectedQty;

  const handleReserveTicket = async (e) => {
    e.preventDefault();
    if (!attendeeName.trim() || !attendeePhone.trim()) {
      toastService.error('Please provide attendee name and phone number.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        tierId: selectedTier.id,
        quantity: selectedQty,
        attendeeName,
        attendeePhone,
        attendeeEmail,
      };

      const res = await ticketService.bookTicket(eventId, payload);
      if (res.success) {
        setConfirmedTicket(res.data);
        setIsConfirmModalOpen(true);
        toastService.success('Pass reservation confirmed! Pay at venue check-in.');
      }
    } catch {
      toastService.error('Failed to create reservation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px]">
        <LoadingSpinner size="lg" text="Loading event ticket tiers..." />
      </div>
    );
  }

  return (
    <div className="max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 sm:gap-8 pb-16">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-light-border dark:border-dark-border pb-5">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            icon={faArrowLeft}
            onClick={() => navigate(-1)}
            aria-label="Back to Event Details"
          />
          <div>
            <h1 className="font-headline font-bold text-xl sm:text-2xl text-light-on-background dark:text-dark-on-background">
              Ticket Booking
            </h1>
            <p className="font-body text-xs sm:text-sm text-light-muted dark:text-dark-muted">
              {eventData?.eventTitle || 'Dhaka Floodlit Futsal Cup 2026'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Badge variant="warning" size="sm" hasDot>
            Pay at Venue Mode
          </Badge>
        </div>
      </div>

      {/* Main Grid Layout (Reference lines 121-160 in UIUX/ticket_booking/code.html) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 cols): Payment Notice & Ticket Tiers */}
        <section className="lg:col-span-7 flex flex-col gap-5">
          {/* Online Payment Notice (Strict Reference Compliance) */}
          <div className="rounded-lg bg-light-surface dark:bg-dark-surface border border-warning/80 p-4 sm:p-5 flex items-start gap-3.5 shadow-sm">
            <span className="w-8 h-8 rounded-full bg-warning/15 text-warning flex items-center justify-center shrink-0 mt-0.5">
              <FontAwesomeIcon icon={faTriangleExclamation} className="text-sm" />
            </span>
            <div className="flex flex-col gap-1">
              <h2 className="font-headline font-bold text-sm text-warning">
                Checkout Notice (Preview Mode)
              </h2>
              <p className="font-body text-xs sm:text-sm text-light-on-surface dark:text-dark-on-surface">
                Online payment checkout is currently unavailable until payment gateway APIs are connected.
                You can select ticket tiers below to hold your reservation pass with pay-at-venue settlement.
              </p>
            </div>
          </div>

          {/* Event Details Quick Summary */}
          <div className="rounded-lg bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border p-4 flex flex-col gap-2">
            <h3 className="font-headline font-bold text-base text-light-on-surface dark:text-dark-on-surface">
              {eventData?.eventTitle}
            </h3>
            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-light-muted dark:text-dark-muted">
              <span className="flex items-center gap-1.5">
                <FontAwesomeIcon icon={faLocationDot} className="text-primary text-[11px]" />
                <span>{eventData?.venue}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <FontAwesomeIcon icon={faCalendarDays} className="text-primary text-[11px]" />
                <span>{eventData?.date}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <FontAwesomeIcon icon={faClock} className="text-primary text-[11px]" />
                <span>{eventData?.time}</span>
              </span>
            </div>
          </div>

          {/* Ticket Tiers */}
          <div className="flex flex-col gap-3.5">
            <h2 className="font-headline font-bold text-lg text-light-on-surface dark:text-dark-on-surface">
              Select Ticket Tier
            </h2>

            {eventData?.tiers?.map((tier) => {
              const isSelected = selectedTierId === tier.id;
              const qty = quantities[tier.id] || 1;

              return (
                <article
                  key={tier.id}
                  onClick={() => handleSelectTier(tier.id)}
                  className={`rounded-lg bg-light-surface dark:bg-dark-surface p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-150 cursor-pointer shadow-sm ${
                    isSelected
                      ? 'border-2 border-primary ring-1 ring-primary/20'
                      : 'border border-light-border dark:border-dark-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex flex-col gap-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-headline font-bold text-base text-light-on-surface dark:text-dark-on-surface">
                        {tier.name}
                      </h3>
                      {tier.badge && (
                        <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary font-label text-[10px] font-semibold">
                          {tier.badge}
                        </span>
                      )}
                    </div>
                    <p className="font-body text-xs text-light-muted dark:text-dark-muted">
                      {tier.description}
                    </p>
                    <span className="font-mono text-[11px] text-light-muted dark:text-dark-muted">
                      {tier.availableQuantity} passes remaining
                    </span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-light-border dark:border-dark-border">
                    <span
                      className={`font-headline font-bold text-lg tabular-nums ${
                        isSelected ? 'text-primary' : 'text-light-on-surface dark:text-dark-on-surface'
                      }`}
                    >
                      BDT {tier.price}
                    </span>

                    {/* Quantity Selector */}
                    {isSelected && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border rounded-md p-1"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            handleQuantityChange(tier.id, -1, tier.maxPerOrder, tier.availableQuantity)
                          }
                          disabled={qty <= 1}
                          className="w-7 h-7 rounded flex items-center justify-center text-xs text-light-muted dark:text-dark-muted hover:text-light-on-surface dark:hover:text-dark-on-surface disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label="Decrease quantity"
                        >
                          <FontAwesomeIcon icon={faMinus} />
                        </button>
                        <span className="font-mono text-xs font-bold w-6 text-center tabular-nums">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleQuantityChange(tier.id, 1, tier.maxPerOrder, tier.availableQuantity)
                          }
                          disabled={qty >= tier.maxPerOrder || qty >= tier.availableQuantity}
                          className="w-7 h-7 rounded flex items-center justify-center text-xs text-light-muted dark:text-dark-muted hover:text-light-on-surface dark:hover:text-dark-on-surface disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label="Increase quantity"
                        >
                          <FontAwesomeIcon icon={faPlus} />
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Right Column (5 cols): Order Summary & Reservation Form */}
        <aside className="lg:col-span-5 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-6 flex flex-col gap-5 shadow-sm sticky top-20">
          <div className="flex items-center justify-between">
            <h2 className="font-headline font-bold text-xl text-light-on-surface dark:text-dark-on-surface">
              Order Summary
            </h2>
            <FontAwesomeIcon icon={faTicket} className="text-primary text-base" />
          </div>

          {/* Breakdown Row */}
          <div className="flex flex-col gap-2.5 py-3 border-y border-light-border dark:border-dark-border font-body text-sm">
            <div className="flex items-center justify-between">
              <span className="text-light-on-surface dark:text-dark-on-surface">
                {selectedQty} × {selectedTier?.name}
              </span>
              <span className="font-mono font-bold text-light-on-surface dark:text-dark-on-surface tabular-nums">
                BDT {subtotal}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-light-muted dark:text-dark-muted">
              <span>Platform Reservation Fee</span>
              <span className="text-success font-semibold">FREE</span>
            </div>
            <div className="flex items-center justify-between text-xs text-light-muted dark:text-dark-muted">
              <span>Settlement Method</span>
              <span className="text-warning font-semibold">Pay at Venue Gate</span>
            </div>
          </div>

          {/* Total Calculation */}
          <div className="flex items-center justify-between">
            <span className="font-headline font-bold text-base text-light-on-surface dark:text-dark-on-surface">
              Total Due at Venue:
            </span>
            <span className="font-headline font-extrabold text-2xl text-primary tabular-nums">
              BDT {subtotal}
            </span>
          </div>

          {/* Attendee Form */}
          <form onSubmit={handleReserveTicket} className="flex flex-col gap-3.5 pt-2">
            <h3 className="font-label font-bold text-xs uppercase tracking-wider text-light-muted dark:text-dark-muted">
              Attendee Details
            </h3>

            <div className="flex flex-col gap-1">
              <label htmlFor="attendeeName" className="font-label text-xs font-semibold text-light-on-surface dark:text-dark-on-surface">
                Full Name
              </label>
              <div className="relative">
                <input
                  id="attendeeName"
                  type="text"
                  required
                  value={attendeeName}
                  onChange={(e) => setAttendeeName(e.target.value)}
                  placeholder="e.g. Tanvir Hasan"
                  className="w-full pl-9 pr-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-xs focus:ring-2 focus:ring-primary focus:border-primary text-light-on-surface dark:text-dark-on-surface"
                />
                <FontAwesomeIcon
                  icon={faUser}
                  className="absolute left-3 top-2.5 text-xs text-light-muted dark:text-dark-muted"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="attendeePhone" className="font-label text-xs font-semibold text-light-on-surface dark:text-dark-on-surface">
                Contact Phone
              </label>
              <div className="relative">
                <input
                  id="attendeePhone"
                  type="tel"
                  required
                  value={attendeePhone}
                  onChange={(e) => setAttendeePhone(e.target.value)}
                  placeholder="e.g. +880 1711-234567"
                  className="w-full pl-9 pr-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-xs focus:ring-2 focus:ring-primary focus:border-primary text-light-on-surface dark:text-dark-on-surface"
                />
                <FontAwesomeIcon
                  icon={faPhone}
                  className="absolute left-3 top-2.5 text-xs text-light-muted dark:text-dark-muted"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="attendeeEmail" className="font-label text-xs font-semibold text-light-on-surface dark:text-dark-on-surface">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="attendeeEmail"
                  type="email"
                  value={attendeeEmail}
                  onChange={(e) => setAttendeeEmail(e.target.value)}
                  placeholder="e.g. tanvir@khelahobe.com"
                  className="w-full pl-9 pr-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-xs focus:ring-2 focus:ring-primary focus:border-primary text-light-on-surface dark:text-dark-on-surface"
                />
                <FontAwesomeIcon
                  icon={faEnvelope}
                  className="absolute left-3 top-2.5 text-xs text-light-muted dark:text-dark-muted"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={submitting}
              className="w-full mt-2"
            >
              Reserve Pass (Pay at Venue)
            </Button>

            <p className="font-body text-xs text-light-muted dark:text-dark-muted text-center leading-relaxed">
              No online charges are processed in this preview state. Your spot is held in the verified organizer registry.
            </p>
          </form>
        </aside>
      </div>

      {/* Confirmation Modal */}
      {confirmedTicket && (
        <Modal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          title="Reservation Confirmed!"
          maxWidth="max-w-md"
        >
          <div className="flex flex-col items-center text-center gap-4 py-2">
            <span className="w-14 h-14 rounded-full bg-success/20 text-success flex items-center justify-center">
              <FontAwesomeIcon icon={faCircleCheck} className="text-2xl" />
            </span>

            <div>
              <h2 className="font-headline font-bold text-xl text-light-on-surface dark:text-dark-on-surface">
                {confirmedTicket.eventTier}
              </h2>
              <p className="font-body text-xs text-light-muted dark:text-dark-muted mt-1">
                {confirmedTicket.title}
              </p>
            </div>

            {/* Simulated QR Code */}
            <div className="p-4 rounded-lg bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border flex flex-col items-center gap-2 w-full">
              <div className="w-28 h-28 bg-white p-2 rounded flex items-center justify-center shadow-sm">
                <svg viewBox="0 0 100 100" className="w-full h-full text-black" fill="currentColor">
                  <rect x="0" y="0" width="30" height="30" fill="black" />
                  <rect x="5" y="5" width="20" height="20" fill="white" />
                  <rect x="10" y="10" width="10" height="10" fill="black" />
                  <rect x="70" y="0" width="30" height="30" fill="black" />
                  <rect x="75" y="5" width="20" height="20" fill="white" />
                  <rect x="80" y="10" width="10" height="10" fill="black" />
                  <rect x="0" y="70" width="30" height="30" fill="black" />
                  <rect x="5" y="75" width="20" height="20" fill="white" />
                  <rect x="10" y="80" width="10" height="10" fill="black" />
                  <rect x="40" y="10" width="10" height="10" fill="black" />
                  <rect x="40" y="30" width="20" height="10" fill="black" />
                  <rect x="70" y="40" width="15" height="15" fill="black" />
                  <rect x="35" y="50" width="10" height="20" fill="black" />
                  <rect x="75" y="70" width="20" height="20" fill="black" />
                </svg>
              </div>
              <p className="font-mono text-xs font-bold text-primary tracking-wider">
                {confirmedTicket.id}
              </p>
              <span className="font-body text-[11px] text-light-muted dark:text-dark-muted">
                Present this code at gate check-in • Pay {confirmedTicket.fee}
              </span>
            </div>

            <div className="flex items-center gap-3 w-full pt-2">
              <Button
                variant="outline"
                size="md"
                className="flex-1"
                onClick={() => setIsConfirmModalOpen(false)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={() => navigate(ROUTES.PLAYER_TICKETS)}
              >
                View My Tickets
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TicketBookingPage;
