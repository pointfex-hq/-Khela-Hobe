import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faCalendarCheck,
  faLocationDot,
  faTrophy,
  faUsers,
  faCircleCheck,
  faShieldHalved,
  faTicket,
  faClock,
} from '@fortawesome/free-solid-svg-icons';
import { eventService } from '../../services/endpoints/eventService';
import Modal from '../../components/modals/Modal';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import { toastService } from '../../components/feedback/toastService';
import { ROUTES } from '../../constants/routes';

export const EventDetailsPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [captainPhone, setCaptainPhone] = useState('');

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const res = await eventService.getEventDetails(eventId || 'evt_corp_cup');
        if (res?.data) {
          setEvent(res.data);
        }
      } catch (err) {
        console.error('Failed to load event details', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [eventId]);

  const handleRegisterTeam = (e) => {
    e.preventDefault();
    if (!teamName.trim()) {
      toastService.error('Please enter your team name.');
      return;
    }
    setRegistering(true);
    setTimeout(() => {
      setRegistering(false);
      setIsRegisterModalOpen(false);
      setEvent((prev) => ({
        ...prev,
        registeredTeams: (prev.registeredTeams || 1) + 1,
        participants: [
          ...(prev.participants || []),
          {
            id: `ep_${Date.now()}`,
            name: teamName.trim(),
            captain: 'You',
            members: 7,
            status: 'Confirmed',
            checkedIn: false,
          },
        ],
      }));
      toastService.success(`Team "${teamName}" registered! Pay fee at venue check-in.`);
    }, 600);
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="lg" message="Loading tournament details..." />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-12 text-center">
        <p className="text-light-muted dark:text-dark-muted">Event not found.</p>
        <Link to={ROUTES.EXPLORE_MATCHES} className="text-primary hover:underline mt-2 inline-block">
          Explore Matches
        </Link>
      </div>
    );
  }

  const remainingTeams = Math.max(0, (event.totalTeams || 16) - (event.registeredTeams || 0));

  return (
    <div className="max-w-6xl w-full mx-auto flex flex-col gap-6">
      {/* Header (Reference: UIUX/event_details/code.html lines 184-193) */}
      <header className="flex items-center justify-between gap-4 pb-2 border-b border-light-border dark:border-dark-border">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border hover:border-primary text-light-muted dark:text-dark-muted transition-colors"
            aria-label="Back to Events"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
          </button>
          <div>
            <h1 className="font-headline text-title-lg font-bold">Organized Event</h1>
            <p className="font-body text-body-sm text-light-muted dark:text-dark-muted">
              {event.title}
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border font-label text-label-sm text-accent font-semibold">
          {event.status || 'Upcoming Tournament'}
        </span>
      </header>

      {/* Main Grid (Lines 195-231) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 8 Columns: Hero & Content */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="rounded-lg overflow-hidden border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface shadow-sm">
            <img
              src={event.image}
              alt={event.title}
              className="w-full h-64 sm:h-80 object-cover"
            />
            <div className="p-6 flex flex-col gap-3">
              <span className="self-start px-2.5 py-1 rounded-full bg-light-surface-elevated dark:bg-dark-surface-elevated text-primary font-label text-label-sm font-semibold">
                {event.format || `${event.sport} • Tournament`}
              </span>
              <h1 className="font-headline text-headline-lg font-bold tracking-tight">
                {event.title}
              </h1>
              <p className="font-body text-body-lg text-light-muted dark:text-dark-muted leading-relaxed">
                {event.description}
              </p>
            </div>
          </div>

          {/* Tournament Highlights & Amenities */}
          <div className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-6 flex flex-col gap-4">
            <h2 className="font-headline text-title-md font-bold">Tournament Features &amp; Rules</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-body text-body-md text-light-muted dark:text-dark-muted">
              <div className="flex items-center gap-2.5">
                <FontAwesomeIcon icon={faCircleCheck} className="text-primary text-sm shrink-0" />
                <span>Certified referees &amp; official match balls provided</span>
              </div>
              <div className="flex items-center gap-2.5">
                <FontAwesomeIcon icon={faCircleCheck} className="text-primary text-sm shrink-0" />
                <span>Hydration station and first aid kits on pitch side</span>
              </div>
              <div className="flex items-center gap-2.5">
                <FontAwesomeIcon icon={faCircleCheck} className="text-primary text-sm shrink-0" />
                <span>Live digital bracket &amp; score tracking</span>
              </div>
              <div className="flex items-center gap-2.5">
                <FontAwesomeIcon icon={faCircleCheck} className="text-primary text-sm shrink-0" />
                <span>Trophies, medals, and fair-play honors for podium finishers</span>
              </div>
            </div>
          </div>

          {/* Registered Teams List */}
          {event.participants && event.participants.length > 0 && (
            <div className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="font-headline text-title-md font-bold">Registered Squads</h2>
                <span className="font-mono text-xs text-light-muted dark:text-dark-muted">
                  {event.participants.length} squads locked
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {event.participants.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border/60 dark:border-dark-border/60 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-headline text-label-lg font-semibold">{p.name}</p>
                      <p className="font-body text-xs text-light-muted dark:text-dark-muted">
                        Capt: {p.captain} • {p.members} players
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-success/15 text-success font-label text-xs font-semibold">
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 4 Columns: Aside Info & Ticket Selection */}
        <aside className="lg:col-span-4 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-6 flex flex-col gap-5 sticky top-20 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <FontAwesomeIcon icon={faCalendarCheck} className="text-primary text-lg mt-0.5 shrink-0" />
              <div>
                <p className="font-label text-label-md font-semibold">{event.date}</p>
                <p className="font-body text-body-sm text-light-muted dark:text-dark-muted tabular-nums">
                  {event.time} ({event.duration || 'Full Session'})
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FontAwesomeIcon icon={faLocationDot} className="text-primary text-lg mt-0.5 shrink-0" />
              <div>
                <p className="font-label text-label-md font-semibold">{event.venue}</p>
                <p className="font-body text-body-sm text-light-muted dark:text-dark-muted">
                  Organized by {event.organizerName}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FontAwesomeIcon icon={faUsers} className="text-primary text-lg mt-0.5 shrink-0" />
              <div>
                <p className="font-label text-label-md font-semibold tabular-nums">
                  {event.registeredTeams} / {event.totalTeams} Teams Registered
                </p>
                <p className="font-body text-body-sm text-success font-medium tabular-nums">
                  {remainingTeams > 0 ? `${remainingTeams} slots remaining` : 'Tournament Full'}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border flex flex-col gap-1">
              <span className="font-label text-xs uppercase text-light-muted dark:text-dark-muted font-semibold">
                Entry Fee &amp; Settlement
              </span>
              <p className="font-headline text-title-md font-bold text-primary">
                {event.fee || 'BDT 3,000 / Team'}
              </p>
              <span className="font-body text-xs text-light-muted dark:text-dark-muted">
                {event.paymentMode || 'Reservation pass • Pay at venue check-in'}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() =>
                navigate(ROUTES.TICKET_BOOKING.replace(':eventId', event.id || 'evt_01'))
              }
              className="w-full py-3 rounded-md bg-primary text-on-primary font-label text-label-lg font-semibold hover:opacity-90 transition-opacity shadow-sm flex items-center justify-center gap-2"
            >
              <FontAwesomeIcon icon={faTicket} className="text-sm" />
              <span>Book Tickets / Passes</span>
            </button>

            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(true)}
              className="w-full py-2.5 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border text-light-on-surface dark:text-dark-on-surface font-label text-xs sm:text-sm font-semibold hover:border-primary transition-colors flex items-center justify-center gap-2"
            >
              <FontAwesomeIcon icon={faUsers} className="text-xs" />
              <span>Register Team Roster</span>
            </button>
          </div>
        </aside>
      </div>

      {/* Team Registration Modal */}
      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title={`Register for ${event.title}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRegisterTeam} className="flex flex-col gap-4">
          <div className="p-3 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border text-xs text-light-muted dark:text-dark-muted">
            Pay-at-venue reservation: Your spot is held immediately. Please arrive 30 minutes before kickoff for jersey check and captain sign-in.
          </div>

          <label className="flex flex-col gap-1">
            <span className="font-label text-label-sm font-semibold">Team Name</span>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. Uttara Thunderbolts"
              required
              className="w-full px-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md focus:border-primary focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-label text-label-sm font-semibold">Captain Contact Phone</span>
            <input
              type="text"
              value={captainPhone}
              onChange={(e) => setCaptainPhone(e.target.value)}
              placeholder="+880 17..."
              className="w-full px-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md focus:border-primary focus:outline-none"
            />
          </label>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-light-border dark:border-dark-border">
            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(false)}
              className="px-4 py-2 rounded-md bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border font-label text-label-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={registering}
              className="px-5 py-2 rounded-md bg-primary text-on-primary font-label text-label-md font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {registering ? 'Confirming...' : 'Confirm Registration'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EventDetailsPage;
