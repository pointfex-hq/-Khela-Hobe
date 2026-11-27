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
import { paymentService } from '../../services/endpoints/paymentService';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';
import { toastService } from '../../components/feedback/toastService';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import Modal from '../../components/modals/Modal';
import QrCodeCanvas from '../../components/common/QrCodeCanvas';
import { downloadTicketPassPdf } from '../../utils/ticketPdfGenerator';

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
  const [attendeeName, setAttendeeName] = useState(user?.name || '');
  const [attendeePhone, setAttendeePhone] = useState(user?.phone || '');
  const [attendeeEmail, setAttendeeEmail] = useState(user?.email || '');
  const [paymentMethod, setPaymentMethod] = useState('sslcommerz');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
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
  const discountAmount = appliedCoupon?.discountAmount || 0;
  const finalTotal = Math.max(0, subtotal - discountAmount);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim() || !selectedTier) return;
    setValidatingCoupon(true);
    try {
      const res = await ticketService.validateCoupon(eventId, {
        code: couponInput.trim(),
        unitPrice: selectedTier.price || 0,
        quantity: selectedQty,
      });
      if (res?.data) {
        setAppliedCoupon(res.data);
        toastService.success(`Coupon ${res.data.code} applied! Saved BDT ${res.data.discountAmount}.`);
      }
    } catch (err) {
      setAppliedCoupon(null);
      toastService.error(err?.message || 'Invalid or ineligible coupon code.');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleReserveTicket = async (e) => {
    e.preventDefault();
    if (!attendeeName.trim() || !attendeePhone.trim()) {
      toastService.error('Please provide attendee name and phone number.');
      return;
    }

    try {
      setSubmitting(true);

      if (paymentMethod === 'sslcommerz' && finalTotal > 0) {
        const payRes = await paymentService.initiateSslcommerzPayment({
          amount: finalTotal,
          currency: 'BDT',
          purpose: 'EVENT_TICKET',
          eventId,
          productName: `${eventData?.eventTitle || 'Tournament Pass'} - ${selectedTier?.name || 'Ticket'}`,
          customerName: attendeeName.trim(),
          customerEmail: attendeeEmail.trim() || undefined,
          customerPhone: attendeePhone.trim(),
          metadata: {
            eventId,
            tierId: selectedTier?.id,
            quantity: selectedQty,
            couponCode: appliedCoupon?.code || undefined,
            attendeeName: attendeeName.trim(),
            attendeePhone: attendeePhone.trim(),
            attendeeEmail: attendeeEmail.trim() || undefined,
          },
        });
        if (payRes?.data?.gatewayUrl) {
          window.location.href = payRes.data.gatewayUrl;
          return;
        }
        toastService.error('SSLCommerz did not return a checkout URL.');
        return;
      }

      const payload = {
        tierId: selectedTier?.id || 'general',
        quantity: selectedQty,
        couponCode: appliedCoupon?.code || undefined,
        attendeeName,
        attendeePhone,
        attendeeEmail: attendeeEmail.trim() || undefined,
      };

      const res = await ticketService.bookTicket(eventId, payload);
      if (res.success) {
        setConfirmedTicket(res.data);
        setIsConfirmModalOpen(true);
        toastService.success(
          finalTotal === 0
            ? `${selectedQty} ticket(s) confirmed & issued!`
            : 'Pass reservation confirmed! Pay at venue check-in.'
        );
      }
    } catch (err) {
      toastService.error(err?.message || 'Failed to initiate payment or reservation.');
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
          <Badge variant={paymentMethod === 'sslcommerz' ? 'primary' : 'warning'} size="sm" hasDot>
            {paymentMethod === 'sslcommerz' ? 'SSLCommerz Checkout' : 'Pay at Venue'}
          </Badge>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 cols): Payment Method & Ticket Tiers */}
        <section className="lg:col-span-7 flex flex-col gap-5">
          {/* Online Payment Selector */}
          <div className="rounded-lg bg-light-surface dark:bg-dark-surface border border-primary/40 p-4 sm:p-5 flex flex-col gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
                <FontAwesomeIcon icon={faCreditCard} className="text-sm" />
              </span>
              <div>
                <h2 className="font-headline font-bold text-sm text-light-on-surface dark:text-dark-on-surface">
                  Select Payment Method
                </h2>
                <p className="font-body text-xs text-light-muted dark:text-dark-muted">
                  Pay online via SSLCommerz (bKash, Nagad, Rocket, Visa/Mastercard) or reserve to pay at the venue.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('sslcommerz')}
                className={`p-3 rounded-md border text-left transition-colors ${
                  paymentMethod === 'sslcommerz'
                    ? 'border-primary bg-primary/10'
                    : 'border-light-border dark:border-dark-border hover:border-primary/50'
                }`}
              >
                <span className="font-label text-xs font-bold block text-light-on-surface dark:text-dark-on-surface">
                  SSLCommerz Online
                </span>
                <span className="font-body text-[11px] text-light-muted dark:text-dark-muted">
                  bKash, Nagad, Cards (Sandbox/Live)
                </span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('venue')}
                className={`p-3 rounded-md border text-left transition-colors ${
                  paymentMethod === 'venue'
                    ? 'border-primary bg-primary/10'
                    : 'border-light-border dark:border-dark-border hover:border-primary/50'
                }`}
              >
                <span className="font-label text-xs font-bold block text-light-on-surface dark:text-dark-on-surface">
                  Pay at Venue Gate
                </span>
                <span className="font-body text-[11px] text-light-muted dark:text-dark-muted">
                  Reserve pass and pay on arrival
                </span>
              </button>
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
                      {tier.available ?? tier.availableQuantity ?? 0} passes remaining
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
                            handleQuantityChange(tier.id, -1, tier.maxPerOrder || 10, tier.available ?? tier.availableQuantity ?? 10)
                          }
                          disabled={qty <= 1}
                          className="w-9 h-9 sm:w-7 sm:h-7 rounded flex items-center justify-center text-xs text-light-muted dark:text-dark-muted hover:text-light-on-surface dark:hover:text-dark-on-surface disabled:opacity-30 disabled:cursor-not-allowed"
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
                            handleQuantityChange(tier.id, 1, tier.maxPerOrder || 10, tier.available ?? tier.availableQuantity ?? 10)
                          }
                          disabled={qty >= (tier.maxPerOrder || 10) || qty >= (tier.available ?? tier.availableQuantity ?? 10)}
                          className="w-9 h-9 sm:w-7 sm:h-7 rounded flex items-center justify-center text-xs text-light-muted dark:text-dark-muted hover:text-light-on-surface dark:hover:text-dark-on-surface disabled:opacity-30 disabled:cursor-not-allowed"
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
        <aside className="lg:col-span-5 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-4 sm:p-6 flex flex-col gap-5 shadow-sm lg:sticky lg:top-20">
          <div className="flex items-center justify-between">
            <h2 className="font-headline font-bold text-xl text-light-on-surface dark:text-dark-on-surface">
              Order Summary
            </h2>
            <FontAwesomeIcon icon={faTicket} className="text-primary text-base" />
          </div>

          {/* Coupon Input */}
          {subtotal > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="font-label text-xs font-semibold">Promo / Account Discount Coupon</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Enter coupon code..."
                  className="flex-1 px-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-mono text-xs uppercase"
                />
                <button
                  type="button"
                  disabled={validatingCoupon}
                  onClick={handleApplyCoupon}
                  className="px-3.5 py-2 rounded-md border border-primary text-primary font-label text-xs font-semibold hover:bg-primary/10 disabled:opacity-50"
                >
                  {validatingCoupon ? '...' : 'Apply'}
                </button>
              </div>
              {appliedCoupon && (
                <span className="text-xs text-success font-semibold">
                  Applied {appliedCoupon.code}: -BDT {appliedCoupon.discountAmount}
                </span>
              )}
            </div>
          )}

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
            {discountAmount > 0 && (
              <div className="flex items-center justify-between text-xs text-success font-semibold">
                <span>Coupon Discount ({appliedCoupon?.code})</span>
                <span>-BDT {discountAmount}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs text-light-muted dark:text-dark-muted">
              <span>Platform Reservation Fee</span>
              <span className="text-success font-semibold">FREE</span>
            </div>
            <div className="flex items-center justify-between text-xs text-light-muted dark:text-dark-muted">
              <span>Settlement Method</span>
              <span className={`font-semibold ${paymentMethod === 'sslcommerz' ? 'text-primary' : 'text-warning'}`}>
                {finalTotal === 0 ? 'Complimentary / Free' : paymentMethod === 'sslcommerz' ? 'SSLCommerz Gateway' : 'Pay at Venue Gate'}
              </span>
            </div>
          </div>

          {/* Total Calculation */}
          <div className="flex items-center justify-between">
            <span className="font-headline font-bold text-base text-light-on-surface dark:text-dark-on-surface">
              {finalTotal === 0 ? 'Total Due:' : paymentMethod === 'sslcommerz' ? 'Total Payable:' : 'Total Due at Venue:'}
            </span>
            <span className="font-headline font-extrabold text-2xl text-primary tabular-nums">
              BDT {finalTotal}
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
              {paymentMethod === 'sslcommerz' && finalTotal > 0
                ? `Pay BDT ${finalTotal} via SSLCommerz`
                : finalTotal === 0
                  ? `Confirm ${selectedQty} Free Pass${selectedQty > 1 ? 'es' : ''}`
                  : `Reserve ${selectedQty} Pass${selectedQty > 1 ? 'es' : ''} (Pay at Venue)`}
            </Button>

            <p className="font-body text-xs text-light-muted dark:text-dark-muted text-center leading-relaxed">
              {paymentMethod === 'sslcommerz'
                ? 'You will be redirected securely to SSLCommerz to complete your payment.'
                : 'Your spot is held in the verified organizer registry for gate settlement.'}
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
                {confirmedTicket.eventTitle || confirmedTicket.title}
              </p>
            </div>

            {/* Pass Codes & Real QR */}
            <div className="p-4 rounded-lg bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border flex flex-col items-center gap-2 w-full">
              <div className="w-32 h-32 bg-white p-2 rounded flex items-center justify-center shadow-sm">
                <QrCodeCanvas
                  value={JSON.stringify({
                    code: (confirmedTicket.ticketCodes && confirmedTicket.ticketCodes[0]) || confirmedTicket.id,
                    tournamentId: eventId,
                  })}
                  size={112}
                  alt="Booked ticket QR code"
                />
              </div>
              <div className="flex flex-wrap justify-center gap-1.5">
                {(confirmedTicket.ticketCodes || [confirmedTicket.id]).map((code) => (
                  <span key={code} className="px-2 py-0.5 rounded bg-primary/15 font-mono text-xs font-bold text-primary tracking-wider">
                    {code}
                  </span>
                ))}
              </div>
              <span className="font-body text-[11px] text-light-muted dark:text-dark-muted">
                {confirmedTicket.quantity || 1} pass(es) • {confirmedTicket.paymentStatus || 'Confirmed'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full pt-2">
              <Button
                variant="outline"
                size="md"
                className="flex-1"
                onClick={() =>
                  downloadTicketPassPdf({
                    id: (confirmedTicket.ticketCodes && confirmedTicket.ticketCodes[0]) || confirmedTicket.id,
                    ticketCode: (confirmedTicket.ticketCodes && confirmedTicket.ticketCodes[0]) || confirmedTicket.id,
                    tournamentId: eventId,
                    title: confirmedTicket.eventTitle || eventData?.eventTitle,
                    venue: eventData?.venue,
                    schedule: `${eventData?.date || ''} • ${eventData?.time || ''}`,
                    eventTier: confirmedTicket.eventTier,
                    attendeeName,
                    fee: finalTotal > 0 ? `BDT ${finalTotal}` : 'Free Pass',
                    paymentStatus: confirmedTicket.paymentStatus || 'Confirmed',
                    status: 'RESERVED',
                  })
                }
              >
                Save Offline PDF
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
