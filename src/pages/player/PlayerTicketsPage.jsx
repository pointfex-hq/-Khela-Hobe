import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTicket,
  faQrcode,
  faCheckCircle,
  faLocationDot,
  faCalendarDays,
  faMoneyBillWave,
  faArrowRight,
  faDownload,
  faBan,
  faEye,
  faFilter,
  faClock,
  faUser,
  faPhone,
  faEnvelope,
  faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';
import { ticketService } from '../../services/endpoints/ticketService';
import { ROUTES } from '../../constants/routes';
import { toastService } from '../../components/feedback/toastService';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import Modal from '../../components/modals/Modal';
import ConfirmationDialog from '../../components/feedback/ConfirmationDialog';
import QrCodeCanvas from '../../components/common/QrCodeCanvas';
import { downloadTicketPassPdf } from '../../utils/ticketPdfGenerator';

export const PlayerTicketsPage = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'all', 'upcoming', 'used', 'cancelled'

  // Modal & Dialog state
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [cancelDialogState, setCancelDialogState] = useState({
    isOpen: false,
    ticketId: null,
    ticketTitle: '',
  });

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await ticketService.getMyTickets();
      if (res.success) {
        setTickets(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load tickets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleDownload = async (ticket) => {
    try {
      await downloadTicketPassPdf(ticket);
      toastService.success(`Offline PDF pass saved for ${ticket?.id || 'your ticket'}.`);
    } catch {
      toastService.error('Could not generate PDF pass.');
    }
  };

  const handleOpenDetails = (ticket) => {
    setSelectedTicket(ticket);
    setIsDetailModalOpen(true);
  };

  const handleOpenCancelDialog = (ticket) => {
    setCancelDialogState({
      isOpen: true,
      ticketId: ticket.id,
      ticketTitle: ticket.title,
    });
  };

  const handleConfirmCancel = async () => {
    if (!cancelDialogState.ticketId) return;

    try {
      const res = await ticketService.cancelTicket(
        cancelDialogState.ticketId,
        'Cancelled by attendee via My Tickets portal'
      );
      if (res.success) {
        toastService.success('Reservation pass cancelled successfully.');
        fetchTickets();
        if (selectedTicket?.id === cancelDialogState.ticketId) {
          setIsDetailModalOpen(false);
        }
      }
    } catch {
      toastService.error('Failed to cancel pass reservation.');
    } finally {
      setCancelDialogState({ isOpen: false, ticketId: null, ticketTitle: '' });
    }
  };

  // Filter tickets by active tab
  const filteredTickets = tickets.filter((t) => {
    if (activeTab === 'upcoming') return t.status === 'Reserved Pass';
    if (activeTab === 'used') return t.status === 'Checked In' || t.isCheckedIn;
    if (activeTab === 'expired') return t.status === 'Expired';
    if (activeTab === 'cancelled') return t.status === 'Cancelled';
    return true; // 'all'
  });

  const upcomingCount = tickets.filter((t) => t.status === 'Reserved Pass').length;
  const usedCount = tickets.filter((t) => t.status === 'Checked In' || t.isCheckedIn).length;
  const expiredCount = tickets.filter((t) => t.status === 'Expired').length;
  const cancelledCount = tickets.filter((t) => t.status === 'Cancelled').length;

  return (
    <div className="flex flex-col gap-6 sm:gap-8 max-w-5xl w-full mx-auto">
      {/* Header Block (Reference lines 208-214 in UIUX/my_tickets/code.html) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-light-border dark:border-dark-border pb-5">
        <div>
          <h1 className="font-headline text-2xl sm:text-3xl font-bold text-light-on-background dark:text-dark-on-background tracking-tight">
            My Tickets
          </h1>
          <p className="font-body text-xs sm:text-sm text-light-muted dark:text-dark-muted mt-1">
            Your reserved tournament passes. QR codes are verified against the backend at venue check-in.
          </p>
        </div>

        <Button
          variant="tertiary"
          size="md"
          icon={faTicket}
          onClick={() => navigate(ROUTES.TOURNAMENTS)}
        >
          Browse Tournaments
        </Button>
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 rounded-full font-label text-xs sm:text-sm whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'upcoming'
              ? 'bg-primary text-on-primary font-bold shadow-sm'
              : 'bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted hover:text-light-on-surface dark:hover:text-dark-on-surface'
          }`}
        >
          <span>Upcoming Passes</span>
          <span className="w-5 h-5 rounded-full bg-light-background/20 dark:bg-dark-background/20 flex items-center justify-center text-[10px] tabular-nums font-bold">
            {upcomingCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('used')}
          className={`px-4 py-2 rounded-full font-label text-xs sm:text-sm whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'used'
              ? 'bg-primary text-on-primary font-bold shadow-sm'
              : 'bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted hover:text-light-on-surface dark:hover:text-dark-on-surface'
          }`}
        >
          <span>Used Passes</span>
          <span className="w-5 h-5 rounded-full bg-light-background/20 dark:bg-dark-background/20 flex items-center justify-center text-[10px] tabular-nums font-bold">
            {usedCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('expired')}
          className={`px-4 py-2 rounded-full font-label text-xs sm:text-sm whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'expired'
              ? 'bg-primary text-on-primary font-bold shadow-sm'
              : 'bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted hover:text-light-on-surface dark:hover:text-dark-on-surface'
          }`}
        >
          <span>Expired</span>
          <span className="w-5 h-5 rounded-full bg-light-background/20 dark:bg-dark-background/20 flex items-center justify-center text-[10px] tabular-nums font-bold">
            {expiredCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cancelled')}
          className={`px-4 py-2 rounded-full font-label text-xs sm:text-sm whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'cancelled'
              ? 'bg-primary text-on-primary font-bold shadow-sm'
              : 'bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted hover:text-light-on-surface dark:hover:text-dark-on-surface'
          }`}
        >
          <span>Cancelled Passes</span>
          <span className="w-5 h-5 rounded-full bg-light-background/20 dark:bg-dark-background/20 flex items-center justify-center text-[10px] tabular-nums font-bold">
            {cancelledCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-full font-label text-xs sm:text-sm whitespace-nowrap transition-colors ${
            activeTab === 'all'
              ? 'bg-primary text-on-primary font-bold shadow-sm'
              : 'bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted hover:text-light-on-surface dark:hover:text-dark-on-surface'
          }`}
        >
          All ({tickets.length})
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[350px]">
          <LoadingSpinner size="lg" text="Loading your event tickets..." />
        </div>
      ) : filteredTickets.length > 0 ? (
        <div className="flex flex-col gap-6">
          {filteredTickets.map((ticket) => {
            const isUpcoming = ticket.status === 'Reserved Pass';
            const isCheckedIn = ticket.status === 'Checked In' || ticket.isCheckedIn;
            const isCancelled = ticket.status === 'Cancelled';

            return (
              <article
                key={ticket.id}
                className={`rounded-lg bg-light-surface dark:bg-dark-surface border p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-center shadow-md transition-all ${
                  isUpcoming
                    ? 'border-light-border dark:border-dark-border'
                    : isCancelled
                    ? 'border-error/30 opacity-75'
                    : 'border-light-border dark:border-dark-border opacity-90'
                }`}
              >
                {/* Left 8 Columns: Details */}
                <div className="md:col-span-8 flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-label text-xs font-bold ${
                        isUpcoming
                          ? 'bg-success text-on-success'
                          : isCheckedIn
                          ? 'bg-light-surface-elevated dark:bg-dark-surface-elevated text-light-muted dark:text-dark-muted'
                          : 'bg-error/20 text-error'
                      }`}
                    >
                      {ticket.status}
                    </span>

                    <span className="px-2.5 py-0.5 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated text-warning font-label text-xs font-medium">
                      {ticket.paymentStatus}
                    </span>
                  </div>

                  <div>
                    <h2 className="font-headline text-lg sm:text-xl font-bold text-light-on-surface dark:text-dark-on-surface">
                      {ticket.title}
                    </h2>
                    <p className="font-body text-xs sm:text-sm text-light-muted dark:text-dark-muted mt-1 flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faLocationDot} className="text-primary text-xs" />
                      <span>{ticket.venue} • {ticket.schedule}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-3 border-t border-light-border dark:border-dark-border">
                    <div>
                      <span className="font-label text-xs text-light-muted dark:text-dark-muted font-medium">
                        Pass ID
                      </span>
                      <p className="font-mono text-xs sm:text-sm font-bold text-primary mt-0.5">
                        {ticket.id}
                      </p>
                    </div>

                    <div>
                      <span className="font-label text-xs text-light-muted dark:text-dark-muted font-medium">
                        Tier
                      </span>
                      <p className="font-label text-xs sm:text-sm font-semibold text-light-on-surface dark:text-dark-on-surface mt-0.5">
                        {ticket.eventTier}
                      </p>
                    </div>

                    <div>
                      <span className="font-label text-xs text-light-muted dark:text-dark-muted font-medium">
                        Venue Fee
                      </span>
                      <p className="font-label text-xs sm:text-sm font-bold tabular-nums text-light-on-surface dark:text-dark-on-surface mt-0.5">
                        {ticket.fee}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <Button
                      variant="primary"
                      size="sm"
                      icon={faEye}
                      onClick={() => handleOpenDetails(ticket)}
                    >
                      View Details
                    </Button>

                    {isUpcoming && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          icon={faDownload}
                          onClick={() => handleDownload(ticket)}
                        >
                          Save Offline Pass
                        </Button>

                        <Button
                          variant="tertiary"
                          size="sm"
                          className="!text-error hover:!bg-error/10"
                          icon={faBan}
                          onClick={() => handleOpenCancelDialog(ticket)}
                        >
                          Cancel Pass
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Right 4 Columns: Real Scannable QR Code */}
                <div className="md:col-span-4 rounded-lg bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border p-5 flex flex-col items-center justify-center gap-2.5 text-center shadow-inner">
                  <div className="w-32 h-32 p-2 rounded-md bg-white flex items-center justify-center shadow-sm">
                    <QrCodeCanvas
                      value={JSON.stringify({ code: ticket.ticketCode || ticket.id, tournamentId: ticket.tournamentId })}
                      size={112}
                      alt={`QR Code for ${ticket.id}`}
                    />
                  </div>

                  <p className="font-mono text-xs font-bold text-light-on-background dark:text-dark-on-background tracking-wider">
                    {ticket.id}
                  </p>
                  <p className="font-body text-[11px] text-light-muted dark:text-dark-muted">
                    {isCheckedIn
                      ? `Checked in at gate: ${ticket.checkInTime || 'Verified'}`
                      : isCancelled
                      ? 'Pass voided / cancelled'
                      : 'Requires organizer scan & backend verification at gate'}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={faTicket}
          title={`No ${activeTab !== 'all' ? activeTab : ''} passes found`}
          description="You don't have any event passes in this category. Explore upcoming tournaments and book your tickets."
          actionText="Browse Upcoming Events"
          onAction={() => navigate(ROUTES.EXPLORE_MATCHES)}
        />
      )}

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title="Digital Ticket Details"
          maxWidth="max-w-md"
        >
          <div className="flex flex-col gap-4 py-2">
            <div className="flex items-center justify-between pb-3 border-b border-light-border dark:border-dark-border">
              <div>
                <span className="font-headline font-bold text-lg text-light-on-surface dark:text-dark-on-surface">
                  {selectedTicket.eventTier}
                </span>
                <p className="font-body text-xs text-light-muted dark:text-dark-muted">
                  {selectedTicket.title}
                </p>
              </div>
              <Badge
                variant={
                  selectedTicket.status === 'Reserved Pass'
                    ? 'success'
                    : selectedTicket.status === 'Checked In'
                    ? 'secondary'
                    : 'error'
                }
                size="sm"
              >
                {selectedTicket.status}
              </Badge>
            </div>

            {/* QR Code */}
            <div className="p-4 rounded-lg bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border flex flex-col items-center gap-2">
              <div className="w-36 h-36 bg-white p-2 rounded flex items-center justify-center shadow-sm">
                <QrCodeCanvas
                  value={JSON.stringify({ code: selectedTicket.ticketCode || selectedTicket.id, tournamentId: selectedTicket.tournamentId })}
                  size={128}
                  alt={`QR Code for ${selectedTicket.id}`}
                />
              </div>
              <span className="font-mono text-sm font-bold text-primary">{selectedTicket.id}</span>
              <span className="text-[11px] text-light-muted dark:text-dark-muted">
                Gate QR Code Presentation
              </span>
            </div>

            {/* Booking Information Rows */}
            <div className="flex flex-col gap-2 font-body text-xs">
              <div className="flex justify-between py-1 border-b border-light-border dark:border-dark-border">
                <span className="text-light-muted dark:text-dark-muted">Venue</span>
                <span className="font-semibold text-right">{selectedTicket.venue}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-light-border dark:border-dark-border">
                <span className="text-light-muted dark:text-dark-muted">Schedule</span>
                <span className="font-semibold text-right">{selectedTicket.schedule}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-light-border dark:border-dark-border">
                <span className="text-light-muted dark:text-dark-muted">Attendee</span>
                <span className="font-semibold text-right">{selectedTicket.attendeeName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-light-border dark:border-dark-border">
                <span className="text-light-muted dark:text-dark-muted">Contact Phone</span>
                <span className="font-mono text-right">{selectedTicket.attendeePhone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-light-border dark:border-dark-border">
                <span className="text-light-muted dark:text-dark-muted">Settlement Fee</span>
                <span className="font-bold text-primary font-mono text-sm text-right">
                  {selectedTicket.fee}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-light-border dark:border-dark-border">
                <span className="text-light-muted dark:text-dark-muted">Payment Notice</span>
                <span className="text-warning text-right">{selectedTicket.paymentStatus}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-light-muted dark:text-dark-muted">Reserved On</span>
                <span className="text-right">{selectedTicket.bookingDate}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <Button
                variant="outline"
                size="md"
                className="flex-1"
                onClick={() => handleDownload(selectedTicket)}
                icon={faDownload}
              >
                Download PDF
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={() => setIsDetailModalOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancel Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={cancelDialogState.isOpen}
        onClose={() => setCancelDialogState({ isOpen: false, ticketId: null, ticketTitle: '' })}
        onConfirm={handleConfirmCancel}
        title="Cancel Ticket Reservation?"
        message={`Are you sure you want to cancel your reservation for "${cancelDialogState.ticketTitle}"? Your pass (${cancelDialogState.ticketId}) will be released for other athletes.`}
        confirmText="Cancel Reservation"
        confirmVariant="danger"
      />
    </div>
  );
};

export default PlayerTicketsPage;
