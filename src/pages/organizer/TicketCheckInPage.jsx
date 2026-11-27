import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faQrcode,
  faCamera,
  faCheckCircle,
  faBan,
  faClock,
  faTicket,
  faSearch,
  faRotateRight,
  faShieldHalved,
  faTags,
  faPlus,
  faTrashCan,
  faPaperPlane,
} from '@fortawesome/free-solid-svg-icons';
import { ticketService } from '../../services/endpoints/ticketService';
import { eventService } from '../../services/endpoints/eventService';
import { ROUTES } from '../../constants/routes';
import { toastService } from '../../components/feedback/toastService';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';

export const TicketCheckInPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialEventId = searchParams.get('eventId') || '';

  const [activeTab, setActiveTab] = useState('verify'); // 'verify' | 'coupons' | 'issue'
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(initialEventId);

  // Verify & check-in state
  const [ticketCodeInput, setTicketCodeInput] = useState('');
  const [autoCheckIn, setAutoCheckIn] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const scannerRef = useRef(null);
  const scanBusyRef = useRef(false);
  const [verifying, setVerifying] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [registryTickets, setRegistryTickets] = useState([]);
  const [ticketSummary, setTicketSummary] = useState(null);
  const [registryFilter, setRegistryFilter] = useState('all'); // 'all' | 'paid' | 'venue' | 'used'

  // Coupons state
  const [coupons, setCoupons] = useState([]);
  const [couponCode, setCouponCode] = useState('');
  const [discountType, setDiscountType] = useState('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState(20);
  const [maxUses, setMaxUses] = useState(50);
  const [eligibleSafetyIds, setEligibleSafetyIds] = useState('');
  const [couponExpiry, setCouponExpiry] = useState('');
  const [creatingCoupon, setCreatingCoupon] = useState(false);

  // Direct ticket issuance state
  const [issueSafetyId, setIssueSafetyId] = useState('');
  const [issueQty, setIssueQty] = useState(1);
  const [issueComplimentary, setIssueComplimentary] = useState(true);
  const [issuingTicket, setIssuingTicket] = useState(false);

  useEffect(() => {
    eventService
      .getOrganizerEvents('all')
      .then((res) => {
        const list = res?.data || [];
        setEvents(list);
        if (!selectedEventId && list[0]) {
          setSelectedEventId(list[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const loadEventManagementData = async (eventId) => {
    if (!eventId) {
      setRegistryTickets([]);
      setTicketSummary(null);
      setCoupons([]);
      return;
    }
    try {
      const [regRes, coupRes] = await Promise.all([
        ticketService.getEventTicketsRegistry(eventId, true),
        ticketService.getEventCoupons(eventId),
      ]);
      setRegistryTickets(regRes.data || []);
      setTicketSummary(regRes.summary || null);
      setCoupons(coupRes.data || []);
    } catch {
      // Ignore if not loaded yet
    }
  };

  useEffect(() => {
    if (selectedEventId) {
      loadEventManagementData(selectedEventId);
    }
  }, [selectedEventId]);

  const stopCameraScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch {
        // Ignore cleanup noise
      }
      scannerRef.current = null;
    }
    setScannerOpen(false);
  };

  useEffect(() => {
    if (!scannerOpen) return undefined;
    let cancelled = false;
    setCameraError('');

    const startCamera = async () => {
      try {
        const scanner = new Html5Qrcode('kh-qr-reader');
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          async (decodedText) => {
            if (scanBusyRef.current || cancelled) return;
            scanBusyRef.current = true;
            let codeVal = String(decodedText || '').trim();
            if (codeVal.startsWith('{') && codeVal.endsWith('}')) {
              try {
                const parsed = JSON.parse(codeVal);
                if (parsed.code || parsed.ticketCode) {
                  codeVal = String(parsed.code || parsed.ticketCode).trim();
                }
              } catch {
                // Use raw decoded string
              }
            }
            setTicketCodeInput(codeVal.toUpperCase());
            await stopCameraScanner();
            await handleVerify(codeVal, true);
            setTimeout(() => {
              scanBusyRef.current = false;
            }, 800);
          },
          () => {
            // Frame scan miss is expected while aiming camera
          }
        );
      } catch (err) {
        if (!cancelled) {
          setCameraError(
            err?.message ||
              'Camera access was denied or unavailable. Please allow camera permission in your browser or enter the pass code manually.'
          );
          setScannerOpen(false);
        }
      }
    };

    startCamera();
    return () => {
      cancelled = true;
      if (scannerRef.current) {
        const inst = scannerRef.current;
        scannerRef.current = null;
        inst.isScanning && inst.stop().catch(() => {});
      }
    };
  }, [scannerOpen]);

  const handleVerify = async (codeToVerify, forceAutoCheckIn) => {
    const code = (codeToVerify || ticketCodeInput).trim();
    if (!code) {
      toastService.error('Please enter or scan a ticket code to verify.');
      return;
    }

    const shouldAutoCheckIn = forceAutoCheckIn !== undefined ? forceAutoCheckIn : autoCheckIn;

    try {
      setVerifying(true);
      const res = await ticketService.verifyTicket(
        code,
        selectedEventId || undefined,
        shouldAutoCheckIn
      );
      setVerificationResult(res);
      if (res.status === 'CHECKED_IN_SUCCESS') {
        toastService.success(res.message || 'Ticket verified and marked USED!');
        await loadEventManagementData(selectedEventId);
      } else if (res.status === 'VALID') {
        toastService.success('Valid ticket verified! Ready for gate check-in.');
      } else if (res.status === 'ALREADY_USED') {
        toastService.error('Ticket already used!');
      } else if (res.status === 'EXPIRED') {
        toastService.error('Ticket is expired!');
      } else {
        toastService.error(res.message || 'Invalid or fake ticket code!');
      }
    } catch (err) {
      toastService.error(err?.message || 'Verification failed.');
    } finally {
      setVerifying(false);
    }
  };

  const handleConfirmCheckIn = async () => {
    if (!verificationResult?.data?.id) return;
    try {
      setCheckingIn(true);
      const res = await ticketService.checkInTicket(verificationResult.data.id);
      if (res.success) {
        toastService.success(res.message);
        setVerificationResult({
          success: true,
          status: 'CHECKED_IN_SUCCESS',
          message: res.message,
          data: res.data,
        });
        await loadEventManagementData(selectedEventId);
      }
    } catch (err) {
      toastService.error(err?.message || 'Check-in failed.');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!selectedEventId || !couponCode.trim()) return;
    setCreatingCoupon(true);
    try {
      const safetyArr = eligibleSafetyIds
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      await ticketService.createCoupon(selectedEventId, {
        code: couponCode.trim().toUpperCase(),
        discountType,
        discountValue: Number(discountValue),
        maxUses: Number(maxUses) || 50,
        eligibleSafetyIds: safetyArr,
        expiresAt: couponExpiry || null,
      });
      toastService.success(`Coupon ${couponCode.trim().toUpperCase()} created!`);
      setCouponCode('');
      setEligibleSafetyIds('');
      await loadEventManagementData(selectedEventId);
    } catch (err) {
      toastService.error(err?.message || 'Failed to create coupon.');
    } finally {
      setCreatingCoupon(false);
    }
  };

  const handleIssueTicket = async (e) => {
    e.preventDefault();
    if (!selectedEventId || !issueSafetyId.trim()) {
      toastService.error('Select a tournament and enter the player Safety ID.');
      return;
    }
    setIssuingTicket(true);
    try {
      const res = await ticketService.bookTicket(selectedEventId, {
        issueToSafetyId: issueSafetyId.trim(),
        quantity: Number(issueQty) || 1,
        complimentary: issueComplimentary,
      });
      toastService.success(
        `Issued ${res.data?.quantity || issueQty} ticket(s) (${res.data?.ticketCodes?.join(', ')})`
      );
      setIssueSafetyId('');
      await loadEventManagementData(selectedEventId);
    } catch (err) {
      toastService.error(err?.message || 'Failed to issue ticket.');
    } finally {
      setIssuingTicket(false);
    }
  };

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  return (
    <div className="max-w-5xl w-full mx-auto flex flex-col gap-5 sm:gap-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-light-border dark:border-dark-border pb-5">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            icon={faArrowLeft}
            onClick={() => navigate(ROUTES.ORGANIZER_EVENTS)}
            aria-label="Back to Event Management"
          />
          <div>
            <h1 className="font-headline font-bold text-xl sm:text-2xl">
              Tournament Ticket &amp; Coupon Management
            </h1>
            <p className="font-body text-xs sm:text-sm text-light-muted dark:text-dark-muted">
              Verify passes, issue tickets to players, and manage discount coupons
            </p>
          </div>
        </div>

        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="px-3.5 py-2 rounded-md bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-xs sm:text-sm font-medium"
        >
          <option value="">All My Tournaments (Code Search)</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.title} ({ev.ticketsSold ?? 0} sold)
            </option>
          ))}
        </select>
      </div>

      {/* Live Ticket Sales & Revenue Stats */}
      {ticketSummary && (
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border">
            <span className="font-label text-[11px] uppercase tracking-wider text-light-muted dark:text-dark-muted block">
              Tickets Sold / Total
            </span>
            <p className="font-headline font-bold text-lg sm:text-xl tabular-nums mt-1 text-primary">
              {ticketSummary.totalSold}
              <span className="text-xs font-normal text-light-muted dark:text-dark-muted">
                {' '}
                / {ticketSummary.totalCapacity ?? 'Unlimited'}
              </span>
            </p>
            <p className="text-[11px] text-light-muted dark:text-dark-muted mt-0.5 tabular-nums">
              {ticketSummary.remainingTickets !== null
                ? `${ticketSummary.remainingTickets} tickets left`
                : 'Open Spectator Mode'}
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border">
            <span className="font-label text-[11px] uppercase tracking-wider text-light-muted dark:text-dark-muted block">
              Paid / Free Passes
            </span>
            <p className="font-headline font-bold text-lg sm:text-xl tabular-nums mt-1 text-success">
              {ticketSummary.paidTicketsCount + ticketSummary.freeTicketsCount}
            </p>
            <p className="text-[11px] text-light-muted dark:text-dark-muted mt-0.5 tabular-nums">
              {ticketSummary.paidTicketsCount} paid • {ticketSummary.freeTicketsCount} free/comp
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border">
            <span className="font-label text-[11px] uppercase tracking-wider text-light-muted dark:text-dark-muted block">
              Pay at Venue
            </span>
            <p className="font-headline font-bold text-lg sm:text-xl tabular-nums mt-1 text-warning">
              {ticketSummary.payAtVenueCount}
            </p>
            <p className="text-[11px] text-light-muted dark:text-dark-muted mt-0.5">
              Collect cash at gate
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border">
            <span className="font-label text-[11px] uppercase tracking-wider text-light-muted dark:text-dark-muted block">
              Checked In (Used)
            </span>
            <p className="font-headline font-bold text-lg sm:text-xl tabular-nums mt-1">
              {ticketSummary.checkedInCount}
            </p>
            <p className="text-[11px] text-light-muted dark:text-dark-muted mt-0.5 tabular-nums">
              {ticketSummary.expiredCount} expired • {ticketSummary.cancelledCount} cancelled
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-light-surface dark:bg-dark-surface border border-success/40">
            <span className="font-label text-[11px] uppercase tracking-wider text-light-muted dark:text-dark-muted block">
              Money Earned
            </span>
            <p className="font-headline font-bold text-lg sm:text-xl tabular-nums mt-1 text-success">
              BDT {Number(ticketSummary.moneyEarned || 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-light-muted dark:text-dark-muted mt-0.5">
              Collected online / gate
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-light-surface dark:bg-dark-surface border border-primary/40">
            <span className="font-label text-[11px] uppercase tracking-wider text-light-muted dark:text-dark-muted block">
              Total Revenue
            </span>
            <p className="font-headline font-bold text-lg sm:text-xl tabular-nums mt-1 text-primary">
              BDT {Number(ticketSummary.totalRevenue || 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-light-muted dark:text-dark-muted mt-0.5 tabular-nums">
              Pending: BDT {Number(ticketSummary.pendingPaymentAmount || 0).toLocaleString()}
              {ticketSummary.totalDiscountsGiven > 0
                ? ` • Disc: BDT ${Number(ticketSummary.totalDiscountsGiven).toLocaleString()}`
                : ''}
            </p>
          </div>
        </section>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
        {[
          { id: 'verify', label: `Gate Verify & Registry (${registryTickets.length})`, icon: faQrcode },
          { id: 'coupons', label: `Coupons & Discounts (${coupons.length})`, icon: faTags },
          { id: 'issue', label: 'Issue Tickets to Player', icon: faPaperPlane },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 whitespace-nowrap px-3.5 sm:px-4 py-2 rounded-md font-label text-xs font-semibold flex items-center gap-2 transition-colors ${
              activeTab === tab.id
                ? 'bg-primary text-on-primary'
                : 'bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border hover:border-primary'
            }`}
          >
            <FontAwesomeIcon icon={tab.icon} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: VERIFY & CHECK-IN */}
      {activeTab === 'verify' && (
        <>
          <section className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-5 sm:p-6 flex flex-col gap-3 shadow-sm">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleVerify();
              }}
              className="flex flex-col gap-2"
            >
              <label htmlFor="ticketCodeInput" className="font-label text-xs sm:text-sm font-semibold">
                Verify Ticket Code (Detects Valid, Used, Expired &amp; Fake Passes)
              </label>
              <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                <input
                  id="ticketCodeInput"
                  type="text"
                  value={ticketCodeInput}
                  onChange={(e) => setTicketCodeInput(e.target.value)}
                  placeholder="Enter Ticket Code (e.g. KH-TKT-A1B2C3)"
                  className="flex-1 px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-mono text-xs sm:text-sm uppercase focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={scannerOpen ? 'secondary' : 'outline'}
                    size="md"
                    icon={faCamera}
                    onClick={() => (scannerOpen ? stopCameraScanner() : setScannerOpen(true))}
                  >
                    {scannerOpen ? 'Stop Camera' : 'Scan QR'}
                  </Button>
                  <Button type="submit" variant="primary" size="md" loading={verifying} icon={faSearch}>
                    Verify Ticket
                  </Button>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-light-muted dark:text-dark-muted pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoCheckIn}
                  onChange={(e) => setAutoCheckIn(e.target.checked)}
                  className="rounded text-primary focus:ring-primary accent-primary"
                />
                <span>Automatically mark ticket <strong>USED</strong> upon valid QR scan or manual check</span>
              </label>
            </form>

            {cameraError && (
              <div className="p-3 rounded-md bg-error/10 border border-error/30 text-error text-xs">
                {cameraError}
              </div>
            )}

            {scannerOpen && (
              <div className="rounded-lg border-2 border-primary/50 bg-light-background dark:bg-dark-background p-3 flex flex-col items-center gap-2">
                <p className="font-label text-xs font-semibold text-primary">
                  Point your phone or webcam at the player&apos;s ticket QR code
                </p>
                <div id="kh-qr-reader" className="w-full max-w-sm rounded overflow-hidden" />
              </div>
            )}
          </section>

          {verificationResult && (
            <section className="rounded-lg bg-light-surface dark:bg-dark-surface border-2 p-6 flex flex-col gap-4 shadow-md border-primary/40">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <FontAwesomeIcon
                    icon={
                      verificationResult.status === 'VALID' || verificationResult.status === 'CHECKED_IN_SUCCESS'
                        ? faCheckCircle
                        : verificationResult.status === 'ALREADY_USED' || verificationResult.status === 'EXPIRED'
                          ? faClock
                          : faBan
                    }
                    className={`text-2xl ${
                      verificationResult.status === 'VALID' || verificationResult.status === 'CHECKED_IN_SUCCESS'
                        ? 'text-success'
                        : verificationResult.status === 'ALREADY_USED'
                          ? 'text-warning'
                          : 'text-error'
                    }`}
                  />
                  <div>
                    <h2 className="font-headline font-bold text-lg">{verificationResult.status}</h2>
                    <p className="font-body text-xs text-light-muted dark:text-dark-muted">
                      {verificationResult.message}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setVerificationResult(null)}
                  className="text-xs text-light-muted hover:text-primary"
                >
                  <FontAwesomeIcon icon={faRotateRight} />
                </button>
              </div>

              {verificationResult.data && (
                <div className="rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-light-muted dark:text-dark-muted block">Attendee</span>
                    <strong>{verificationResult.data.attendeeName}</strong>
                  </div>
                  <div>
                    <span className="text-light-muted dark:text-dark-muted block">Tier</span>
                    <strong>{verificationResult.data.eventTier}</strong>
                  </div>
                  <div>
                    <span className="text-light-muted dark:text-dark-muted block">Code</span>
                    <strong className="font-mono text-primary">{verificationResult.data.ticketCode}</strong>
                  </div>
                  <div>
                    <span className="text-light-muted dark:text-dark-muted block">Payment</span>
                    <strong>{verificationResult.data.paymentStatus} ({verificationResult.data.fee})</strong>
                  </div>
                </div>
              )}

              {verificationResult.status === 'VALID' && (
                <div className="flex justify-end">
                  <Button
                    variant="primary"
                    size="md"
                    loading={checkingIn}
                    icon={faCheckCircle}
                    onClick={handleConfirmCheckIn}
                  >
                    Confirm Gate Check-In
                  </Button>
                </div>
              )}
            </section>
          )}

          {/* Issued Ticket Registry */}
          <section className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-5 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="font-headline font-bold text-base">
                Ticket Registry {selectedEvent ? `— ${selectedEvent.title}` : ''}
              </h2>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'all', label: `All (${registryTickets.length})` },
                  {
                    id: 'paid',
                    label: `Paid (${registryTickets.filter((t) => t.paymentStatus === 'PAID' && t.status !== 'CANCELLED').length})`,
                  },
                  {
                    id: 'venue',
                    label: `Pay at Venue (${registryTickets.filter((t) => t.paymentStatus === 'PAY_AT_VENUE' && t.status !== 'CANCELLED').length})`,
                  },
                  {
                    id: 'used',
                    label: `Used (${registryTickets.filter((t) => t.status === 'USED').length})`,
                  },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setRegistryFilter(f.id)}
                    className={`px-2.5 py-1 rounded text-[11px] font-label font-semibold ${
                      registryFilter === f.id
                        ? 'bg-primary text-on-primary'
                        : 'bg-light-surface-elevated dark:bg-dark-surface-elevated text-light-muted dark:text-dark-muted hover:text-primary'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {registryTickets.length === 0 ? (
              <p className="text-xs text-light-muted dark:text-dark-muted py-4">
                No tickets issued or purchased for this tournament yet.
              </p>
            ) : (
              <div className="divide-y divide-light-border dark:divide-dark-border">
                {registryTickets
                  .filter((tk) => {
                    if (registryFilter === 'paid') return tk.paymentStatus === 'PAID' && tk.status !== 'CANCELLED';
                    if (registryFilter === 'venue') return tk.paymentStatus === 'PAY_AT_VENUE' && tk.status !== 'CANCELLED';
                    if (registryFilter === 'used') return tk.status === 'USED';
                    return true;
                  })
                  .map((tk) => (
                  <div key={tk.id} className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-mono font-bold text-primary mr-2">{tk.ticketCode}</span>
                      <strong>{tk.attendeeName}</strong> ({tk.tierName})
                      <span className="ml-2 font-mono font-semibold text-light-on-surface dark:text-dark-on-surface">
                        {Number(tk.finalPrice) > 0 ? `BDT ${tk.finalPrice}` : 'Free'}
                      </span>
                      <span
                        className={`ml-2 px-1.5 py-0.5 rounded font-label text-[10px] font-semibold ${
                          tk.paymentStatus === 'PAID'
                            ? 'bg-success/15 text-success'
                            : 'bg-warning/15 text-warning'
                        }`}
                      >
                        {tk.paymentStatus === 'PAY_AT_VENUE' ? 'Pay at Venue' : 'Paid'}
                      </span>
                      {tk.couponCode && (
                        <span className="ml-2 px-1.5 py-0.5 rounded bg-secondary/15 text-secondary font-mono text-[10px]">
                          {tk.couponCode}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          tk.status === 'USED'
                            ? 'primary'
                            : tk.status === 'EXPIRED' || tk.status === 'CANCELLED'
                              ? 'error'
                              : 'success'
                        }
                        size="sm"
                      >
                        {tk.status}
                      </Badge>
                      <button
                        type="button"
                        onClick={() => {
                          setTicketCodeInput(tk.ticketCode);
                          handleVerify(tk.ticketCode);
                        }}
                        className="text-primary font-label font-semibold hover:underline"
                      >
                        Verify
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* TAB 2: COUPONS & DISCOUNTS */}
      {activeTab === 'coupons' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleCreateCoupon}
            className="lg:col-span-5 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-5 flex flex-col gap-3"
          >
            <h2 className="font-headline font-bold text-base flex items-center gap-2">
              <FontAwesomeIcon icon={faPlus} className="text-primary" />
              <span>Create Discount Coupon</span>
            </h2>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-label font-semibold">Coupon Code</span>
              <input
                type="text"
                required
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="e.g. SQUAD25 or VIP50"
                className="px-3 py-2 rounded border border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background font-mono text-xs uppercase"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-label font-semibold">Discount Type</span>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                  className="px-3 py-2 rounded border border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background text-xs"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Flat (BDT)</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-label font-semibold">Value</span>
                <input
                  type="number"
                  min="1"
                  required
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="px-3 py-2 rounded border border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background text-xs"
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-label font-semibold">Max Uses</span>
                <input
                  type="number"
                  min="1"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  className="px-3 py-2 rounded border border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background text-xs"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-label font-semibold">Expiry Date (Optional)</span>
                <input
                  type="date"
                  value={couponExpiry}
                  onChange={(e) => setCouponExpiry(e.target.value)}
                  className="px-3 py-2 rounded border border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background text-xs"
                />
              </label>
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-label font-semibold">
                Restrict to Specific Player Safety IDs (Optional, comma-separated)
              </span>
              <input
                type="text"
                value={eligibleSafetyIds}
                onChange={(e) => setEligibleSafetyIds(e.target.value)}
                placeholder="Leave blank for everyone, or e.g. KH-12AB34CD"
                className="px-3 py-2 rounded border border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background font-mono text-xs uppercase"
              />
            </label>
            <Button type="submit" variant="primary" size="md" loading={creatingCoupon}>
              Create Coupon
            </Button>
          </form>

          <div className="lg:col-span-7 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-5 flex flex-col gap-3">
            <h2 className="font-headline font-bold text-base">Active &amp; Issued Coupons</h2>
            {coupons.length === 0 ? (
              <p className="text-xs text-light-muted dark:text-dark-muted py-4">
                No coupons created for this tournament yet.
              </p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {coupons.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded border border-light-border dark:border-dark-border flex flex-wrap items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-primary text-sm mr-2">{c.code}</span>
                      <span className="font-semibold">
                        {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% OFF` : `BDT ${c.discountValue} OFF`}
                      </span>
                      <p className="text-[11px] text-light-muted dark:text-dark-muted mt-0.5">
                        Used {c.usedCount}/{c.maxUses} •{' '}
                        {c.eligibleSafetyIds?.length > 0
                          ? `Restricted to: ${c.eligibleSafetyIds.join(', ')}`
                          : 'Open to all buyers'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          ticketService
                            .toggleCoupon(selectedEventId, c.id, !c.active)
                            .then(() => loadEventManagementData(selectedEventId))
                        }
                        className={`px-2.5 py-1 rounded font-semibold ${
                          c.active ? 'bg-success/15 text-success' : 'bg-error/15 text-error'
                        }`}
                      >
                        {c.active ? 'Active' : 'Paused'}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          ticketService
                            .deleteCoupon(selectedEventId, c.id)
                            .then(() => loadEventManagementData(selectedEventId))
                        }
                        className="text-error p-1 hover:opacity-75"
                      >
                        <FontAwesomeIcon icon={faTrashCan} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DIRECT TICKET ISSUANCE */}
      {activeTab === 'issue' && (
        <form
          onSubmit={handleIssueTicket}
          className="max-w-lg rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-6 flex flex-col gap-4"
        >
          <h2 className="font-headline font-bold text-base flex items-center gap-2">
            <FontAwesomeIcon icon={faTicket} className="text-primary" />
            <span>Issue Direct Pass to Player Account</span>
          </h2>
          <p className="font-body text-xs text-light-muted dark:text-dark-muted">
            Send complimentary or VIP tickets directly to a player&apos;s account using their Safety ID. They will immediately see the tickets in their My Tickets wallet.
          </p>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-label font-semibold">Recipient Safety ID</span>
            <input
              type="text"
              required
              value={issueSafetyId}
              onChange={(e) => setIssueSafetyId(e.target.value.toUpperCase())}
              placeholder="e.g. KH-12AB34CD"
              className="px-3 py-2 rounded border border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background font-mono text-sm uppercase"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-label font-semibold">Quantity</span>
              <input
                type="number"
                min="1"
                max="20"
                value={issueQty}
                onChange={(e) => setIssueQty(e.target.value)}
                className="px-3 py-2 rounded border border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background text-sm"
              />
            </label>
            <label className="flex items-center gap-2 pt-5 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={issueComplimentary}
                onChange={(e) => setIssueComplimentary(e.target.checked)}
                className="accent-primary"
              />
              <span>Complimentary (Free)</span>
            </label>
          </div>

          <Button type="submit" variant="primary" size="md" loading={issuingTicket}>
            Issue Ticket(s)
          </Button>
        </form>
      )}
    </div>
  );
};

export default TicketCheckInPage;
