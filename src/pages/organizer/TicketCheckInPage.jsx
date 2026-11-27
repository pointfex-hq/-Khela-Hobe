import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faQrcode,
  faCamera,
  faCheckCircle,
  faTriangleExclamation,
  faBan,
  faClock,
  faUser,
  faPhone,
  faTicket,
  faSearch,
  faRotateRight,
  faShieldHalved,
  faMoneyBillWave,
  faListCheck,
} from '@fortawesome/free-solid-svg-icons';
import { ticketService } from '../../services/endpoints/ticketService';
import { ROUTES } from '../../constants/routes';
import { toastService } from '../../components/feedback/toastService';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';

export const TicketCheckInPage = () => {
  const navigate = useNavigate();

  const [ticketCodeInput, setTicketCodeInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [checkInLog, setCheckInLog] = useState([
    {
      id: 'KH-TKT-77412',
      name: 'Tanvir Hasan',
      tier: 'Single Entry (1x)',
      time: 'Today, 04:45 PM BST',
      status: 'Checked In',
    },
  ]);

  const handleVerify = async (codeToVerify) => {
    const code = (codeToVerify || ticketCodeInput).trim();
    if (!code) {
      toastService.error('Please enter a ticket code to verify.');
      return;
    }

    try {
      setVerifying(true);
      const res = await ticketService.verifyTicket(code);
      setVerificationResult(res);
      if (res.status === 'VALID') {
        toastService.success('Valid ticket identified! Ready for gate check-in.');
      } else if (res.status === 'ALREADY_USED') {
        toastService.error('Warning: Ticket already used!');
      } else {
        toastService.error('Invalid ticket code.');
      }
    } catch {
      toastService.error('Server verification error. Please retry.');
    } finally {
      setVerifying(false);
    }
  };

  const handleConfirmCheckIn = async () => {
    if (!verificationResult?.data?.id) return;

    try {
      setCheckingIn(true);
      const ticketId = verificationResult.data.id;
      const res = await ticketService.checkInTicket(ticketId);
      if (res.success) {
        toastService.success(res.message);
        // Add to log
        const newLogEntry = {
          id: res.data.id,
          name: res.data.attendeeName,
          tier: res.data.eventTier,
          time: res.data.checkInTime || 'Just now',
          status: 'Checked In',
        };
        setCheckInLog((prev) => [newLogEntry, ...prev]);

        // Update verification result
        setVerificationResult({
          success: true,
          status: 'CHECKED_IN_SUCCESS',
          message: `Check-in confirmed for ${res.data.attendeeName}!`,
          data: res.data,
        });
      } else {
        toastService.error(res.message);
      }
    } catch {
      toastService.error('Check-in failed.');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleReset = () => {
    setTicketCodeInput('');
    setVerificationResult(null);
  };

  const simulateQuickScan = (code) => {
    setTicketCodeInput(code);
    handleVerify(code);
  };

  return (
    <div className="max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 sm:gap-8 pb-16">
      {/* Header (Reference lines 108-119 in UIUX/ticket_check_in/code.html) */}
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
            <h1 className="font-headline font-bold text-xl sm:text-2xl text-light-on-background dark:text-dark-on-background">
              Gate Check-In &amp; QR Verification
            </h1>
            <p className="font-body text-xs sm:text-sm text-light-muted dark:text-dark-muted">
              Dhaka Floodlit Futsal Cup 2026 • Entrance Gate A
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border font-label text-xs sm:text-sm text-warning shrink-0 flex items-center gap-1.5 self-start sm:self-auto">
          <FontAwesomeIcon icon={faShieldHalved} className="text-xs" />
          <span>Server Verification Required</span>
        </span>
      </div>

      {/* QR Scanner Interface Frame (Reference lines 122-131) */}
      <section className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-6 sm:p-8 flex flex-col items-center text-center gap-4 shadow-sm">
        <div className="relative w-44 h-44 sm:w-48 sm:h-48 rounded-lg border-2 border-dashed border-primary bg-light-surface-elevated dark:bg-dark-surface-elevated flex flex-col items-center justify-center gap-2 overflow-hidden shadow-inner group">
          <FontAwesomeIcon icon={faCamera} className="text-3xl sm:text-4xl text-primary" />
          <span className="font-label text-xs text-light-muted dark:text-dark-muted font-semibold">
            Camera Scanner Frame
          </span>

          {/* Animated scanner laser beam */}
          <div className="absolute inset-x-0 h-0.5 bg-primary shadow-[0_0_8px_#B9F34A] animate-pulse top-1/2 -translate-y-1/2" />
        </div>

        <div>
          <h2 className="font-headline font-bold text-lg sm:text-xl text-light-on-surface dark:text-dark-on-surface">
            Scan Attendee Ticket QR
          </h2>
          <p className="font-body text-xs sm:text-sm text-light-muted dark:text-dark-muted max-w-md mx-auto mt-1">
            Ticket codes are verified exclusively against the backend ticketing service. Offline or
            frontend-only validation is disabled.
          </p>
        </div>

        {/* Quick Simulation Scanner Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <span className="font-label text-xs text-light-muted dark:text-dark-muted mr-1">
            Scanner Simulation:
          </span>
          <button
            type="button"
            onClick={() => simulateQuickScan('KH-TKT-90841')}
            className="px-2.5 py-1 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border text-xs font-mono text-success hover:border-success transition-colors"
          >
            Valid: KH-TKT-90841
          </button>
          <button
            type="button"
            onClick={() => simulateQuickScan('KH-TKT-77412')}
            className="px-2.5 py-1 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border text-xs font-mono text-warning hover:border-warning transition-colors"
          >
            Used: KH-TKT-77412
          </button>
          <button
            type="button"
            onClick={() => simulateQuickScan('KH-TKT-99999')}
            className="px-2.5 py-1 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border text-xs font-mono text-error hover:border-error transition-colors"
          >
            Invalid: KH-TKT-99999
          </button>
        </div>
      </section>

      {/* Manual Ticket Code Lookup (Reference lines 133-143) */}
      <section className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-5 sm:p-6 flex flex-col gap-3 shadow-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify();
          }}
          className="flex flex-col gap-1.5"
        >
          <label htmlFor="ticketCodeInput" className="font-label text-xs sm:text-sm font-semibold text-light-on-surface dark:text-dark-on-surface">
            Manual Ticket Code Lookup
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              id="ticketCodeInput"
              type="text"
              value={ticketCodeInput}
              onChange={(e) => setTicketCodeInput(e.target.value)}
              placeholder="e.g. KH-TKT-90841 or KH-EVT-2026-XXXX"
              className="flex-1 px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-mono text-xs sm:text-sm uppercase focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-light-on-surface dark:text-dark-on-surface"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={verifying}
              icon={faSearch}
              className="shrink-0"
            >
              Verify Ticket
            </Button>
          </div>
        </form>
      </section>

      {/* Verification Result Display */}
      {verificationResult && (
        <section className="flex flex-col gap-3">
          {/* STATE 1: VALID TICKET */}
          {verificationResult.status === 'VALID' && (
            <div className="rounded-lg bg-light-surface dark:bg-dark-surface border-2 border-success p-6 flex flex-col gap-5 shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-success/20 text-success flex items-center justify-center shrink-0">
                    <FontAwesomeIcon icon={faCheckCircle} className="text-xl" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-headline font-bold text-lg text-success">
                        Valid Pass Verified
                      </h2>
                      <Badge variant="success" size="sm">
                        Gate Entry Authorized
                      </Badge>
                    </div>
                    <p className="font-body text-xs text-light-muted dark:text-dark-muted mt-0.5">
                      Backend verification succeeded against the live attendee registry.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-light-muted dark:text-dark-muted hover:text-light-on-surface dark:hover:text-dark-on-surface p-1"
                >
                  <FontAwesomeIcon icon={faRotateRight} />
                </button>
              </div>

              {/* Attendee Details Card */}
              <div className="rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-body">
                <div>
                  <span className="text-light-muted dark:text-dark-muted font-medium">Attendee</span>
                  <p className="font-bold text-sm text-light-on-surface dark:text-dark-on-surface mt-0.5">
                    {verificationResult.data.attendeeName}
                  </p>
                </div>
                <div>
                  <span className="text-light-muted dark:text-dark-muted font-medium">Tier</span>
                  <p className="font-bold text-sm text-light-on-surface dark:text-dark-on-surface mt-0.5">
                    {verificationResult.data.eventTier}
                  </p>
                </div>
                <div>
                  <span className="text-light-muted dark:text-dark-muted font-medium">Pass ID</span>
                  <p className="font-mono text-sm font-bold text-primary mt-0.5">
                    {verificationResult.data.id}
                  </p>
                </div>
                <div>
                  <span className="text-light-muted dark:text-dark-muted font-medium">
                    Settlement Status
                  </span>
                  <p className="font-semibold text-warning mt-0.5">
                    {verificationResult.data.fee} (Collect at Gate)
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-light-border dark:border-dark-border">
                <Button variant="outline" size="md" onClick={handleReset}>
                  Dismiss
                </Button>
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
            </div>
          )}

          {/* STATE 2: CHECK-IN SUCCESS CONFIRMED */}
          {verificationResult.status === 'CHECKED_IN_SUCCESS' && (
            <div className="rounded-lg bg-success/10 border-2 border-success p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-success text-on-success flex items-center justify-center font-bold text-lg">
                  <FontAwesomeIcon icon={faCheckCircle} />
                </span>
                <div>
                  <h3 className="font-headline font-bold text-base text-success">
                    {verificationResult.message}
                  </h3>
                  <p className="font-body text-xs text-light-muted dark:text-dark-muted">
                    Pass {verificationResult.data.id} recorded in gate audit registry.
                  </p>
                </div>
              </div>

              <Button variant="primary" size="sm" onClick={handleReset} icon={faRotateRight}>
                Scan Next Attendee
              </Button>
            </div>
          )}

          {/* STATE 3: ALREADY USED */}
          {verificationResult.status === 'ALREADY_USED' && (
            <div className="rounded-lg bg-light-surface dark:bg-dark-surface border-2 border-warning p-6 flex flex-col gap-4 shadow-md">
              <div className="flex items-start gap-3">
                <span className="w-10 h-10 rounded-full bg-warning/20 text-warning flex items-center justify-center shrink-0">
                  <FontAwesomeIcon icon={faClock} className="text-xl" />
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-headline font-bold text-lg text-warning">
                      Ticket Already Checked In
                    </h2>
                    <Badge variant="warning" size="sm">
                      Duplicate Scan
                    </Badge>
                  </div>
                  <p className="font-body text-xs sm:text-sm text-light-on-surface dark:text-dark-on-surface mt-1">
                    {verificationResult.message}
                  </p>
                </div>
              </div>

              {verificationResult.data && (
                <div className="rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-body">
                  <span>
                    Attendee: <strong>{verificationResult.data.attendeeName}</strong>
                  </span>
                  <span>
                    Previous Check-In:{' '}
                    <strong>{verificationResult.data.checkInTime || 'Earlier Today'}</strong>
                  </span>
                  <span className="font-mono text-primary">{verificationResult.data.id}</span>
                </div>
              )}

              <div className="flex justify-end pt-2 border-t border-light-border dark:border-dark-border">
                <Button variant="outline" size="sm" onClick={handleReset}>
                  Dismiss
                </Button>
              </div>
            </div>
          )}

          {/* STATE 4: INVALID TICKET */}
          {verificationResult.status === 'INVALID' && (
            <div className="rounded-lg bg-light-surface dark:bg-dark-surface border-2 border-error p-6 flex flex-col gap-4 shadow-md">
              <div className="flex items-start gap-3">
                <span className="w-10 h-10 rounded-full bg-error/20 text-error flex items-center justify-center shrink-0">
                  <FontAwesomeIcon icon={faBan} className="text-xl" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-headline font-bold text-lg text-error">
                      Invalid Ticket Code
                    </h2>
                    <Badge variant="error" size="sm">
                      Access Denied
                    </Badge>
                  </div>
                  <p className="font-body text-xs sm:text-sm text-light-on-surface dark:text-dark-on-surface mt-1">
                    {verificationResult.message}
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-light-border dark:border-dark-border">
                <Button variant="outline" size="sm" onClick={handleReset}>
                  Dismiss
                </Button>
              </div>
            </div>
          )}

          {/* STATE 5: CANCELLED */}
          {verificationResult.status === 'CANCELLED' && (
            <div className="rounded-lg bg-light-surface dark:bg-dark-surface border-2 border-error/70 p-6 flex flex-col gap-4 shadow-md">
              <div className="flex items-start gap-3">
                <span className="w-10 h-10 rounded-full bg-error/20 text-error flex items-center justify-center shrink-0">
                  <FontAwesomeIcon icon={faBan} className="text-xl" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-headline font-bold text-lg text-error">
                      Reservation Void / Cancelled
                    </h2>
                  </div>
                  <p className="font-body text-xs sm:text-sm text-light-on-surface dark:text-dark-on-surface mt-1">
                    {verificationResult.message}
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-light-border dark:border-dark-border">
                <Button variant="outline" size="sm" onClick={handleReset}>
                  Dismiss
                </Button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Gate Check-In History / Audit Log */}
      <section className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-5 sm:p-6 flex flex-col gap-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faListCheck} className="text-primary text-sm" />
            <h2 className="font-headline font-bold text-base sm:text-lg text-light-on-surface dark:text-dark-on-surface">
              Gate Check-In Activity Log
            </h2>
          </div>
          <span className="font-mono text-xs text-light-muted dark:text-dark-muted">
            {checkInLog.length} Attendees Verified
          </span>
        </div>

        <div className="flex flex-col divide-y divide-light-border dark:divide-dark-border">
          {checkInLog.map((log, idx) => (
            <div key={idx} className="py-3 flex items-center justify-between gap-3 text-xs font-body">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-success shrink-0" />
                <div>
                  <span className="font-bold text-light-on-surface dark:text-dark-on-surface">
                    {log.name}
                  </span>
                  <p className="text-light-muted dark:text-dark-muted">
                    {log.tier} • <span className="font-mono">{log.id}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono text-light-muted dark:text-dark-muted tabular-nums">
                  {log.time}
                </span>
                <Badge variant="success" size="sm">
                  {log.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default TicketCheckInPage;
