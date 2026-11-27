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
  faHeart,
  faSquareCheck,
  faPlus,
  faXmark,
  faCreditCard,
} from '@fortawesome/free-solid-svg-icons';
import { eventService } from '../../services/endpoints/eventService';
import { paymentService } from '../../services/endpoints/paymentService';
import { useAuth } from '../../hooks/useAuth';
import Modal from '../../components/modals/Modal';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import BannerCarousel from '../../components/common/BannerCarousel';
import { toastService } from '../../components/feedback/toastService';
import { ROUTES } from '../../constants/routes';

export const EventDetailsPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const isAuth = typeof isAuthenticated === 'function' ? isAuthenticated() : Boolean(isAuthenticated);

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [captainPhone, setCaptainPhone] = useState(user?.phoneNumber || user?.phone || '');
  const [paymentPref, setPaymentPref] = useState('ONLINE');
  const [safetyInput, setSafetyInput] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [teammates, setTeammates] = useState([]);
  const [togglingInterest, setTogglingInterest] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!eventId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await eventService.getEventDetails(eventId);
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

  const handleToggleInterest = async () => {
    if (!isAuth) {
      toastService.info('Please sign in to mark interest in this tournament.');
      return;
    }
    setTogglingInterest(true);
    try {
      const res = await eventService.toggleInterest(event.id);
      if (res?.data) {
        setEvent((prev) => ({
          ...prev,
          isInterested: res.data.interested,
          interestCount: res.data.interestCount,
        }));
      }
    } catch (err) {
      toastService.error(err?.message || 'Could not update interest.');
    } finally {
      setTogglingInterest(false);
    }
  };

  const handleAddTeammateBySafetyId = async () => {
    const code = safetyInput.trim().toUpperCase();
    if (!code) return;
    if (user?.safetyId && code === user.safetyId.toUpperCase()) {
      toastService.info('You are already included as Team Captain.');
      return;
    }
    if (teammates.some((t) => t.safetyId.toUpperCase() === code)) {
      toastService.info('That teammate is already added to your squad.');
      return;
    }
    const maxTeammates = Math.max(0, (event?.teamSize || 7) - 1);
    if (teammates.length >= maxTeammates) {
      toastService.info(`Squad already has all ${event.teamSize} players.`);
      return;
    }

    setLookingUp(true);
    try {
      const res = await eventService.lookupSafetyPlayer(code);
      if (res?.data) {
        setTeammates((prev) => [...prev, res.data]);
        setSafetyInput('');
        toastService.success(`Added ${res.data.fullName} (${res.data.safetyId})`);
      }
    } catch (err) {
      toastService.error(err?.message || `No player found for Safety ID "${code}".`);
    } finally {
      setLookingUp(false);
    }
  };

  const handleRegisterTeam = async (e) => {
    e.preventDefault();
    if (!isAuth) {
      toastService.error('Please sign in to register a team.');
      navigate(ROUTES.LOGIN);
      return;
    }
    if (!teamName.trim()) {
      toastService.error('Please enter your team name.');
      return;
    }
    if (!captainPhone.trim()) {
      toastService.error('Please enter captain contact phone number.');
      return;
    }
    const requiredTeammates = Math.max(0, (event.teamSize || 7) - 1);
    if (teammates.length < requiredTeammates) {
      toastService.error(
        `Please add ${requiredTeammates - teammates.length} more teammate(s) using their Safety ID to complete your ${event.teamSize}-player squad.`
      );
      return;
    }

    const effectivePref =
      event.paymentMode === 'OPEN_FREE' || event.entryFee <= 0
        ? 'FREE'
        : event.paymentMode === 'ONLINE_REQUIRED'
          ? 'ONLINE'
          : paymentPref;

    setRegistering(true);
    try {
      const regRes = await eventService.registerTeam(event.id, {
        teamName: teamName.trim(),
        contactPhone: captainPhone.trim(),
        memberSafetyIds: teammates.map((t) => t.safetyId),
        paymentPreference: effectivePref,
      });

      if (regRes?.data?.requiresPayment && event.entryFee > 0) {
        const payRes = await paymentService.initiateSslcommerzPayment({
          purpose: 'TOURNAMENT_FEE',
          registrationId: regRes.data.id,
          amount: event.entryFee,
          currency: 'BDT',
          productName: `${event.title} - Team ${teamName.trim()}`,
          customerPhone: captainPhone.trim(),
        });
        if (payRes?.data?.gatewayUrl) {
          window.location.href = payRes.data.gatewayUrl;
          return;
        }
        toastService.error('SSLCommerz checkout URL was not returned.');
        return;
      }

      const refreshed = await eventService.getEventDetails(event.id);
      if (refreshed?.data) {
        setEvent(refreshed.data);
      }
      setIsRegisterModalOpen(false);
      setTeamName('');
      setTeammates([]);
      toastService.success(
        `Team "${teamName.trim()}" submitted! ${event.requireTeamApproval ? 'Awaiting organizer approval.' : 'Confirmed!'}`
      );
    } catch (err) {
      toastService.error(err?.message || 'Unable to register team right now.');
    } finally {
      setRegistering(false);
    }
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
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-3 border-b border-light-border dark:border-dark-border">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border hover:border-primary text-light-muted dark:text-dark-muted transition-colors shrink-0"
            aria-label="Back to Events"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
          </button>
          <div className="min-w-0">
            <h1 className="font-headline text-lg sm:text-title-lg font-bold">Organized Event</h1>
            <p className="font-body text-xs sm:text-body-sm text-light-muted dark:text-dark-muted truncate">
              {event.title}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={togglingInterest}
            onClick={handleToggleInterest}
            className={`px-3.5 py-1.5 rounded-full border font-label text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              event.isInterested
                ? 'bg-error text-white border-error'
                : 'bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border hover:border-error text-light-on-surface dark:text-dark-on-surface'
            }`}
          >
            <FontAwesomeIcon icon={faHeart} />
            <span>{event.isInterested ? 'Interested' : 'Show Interest'} ({event.interestCount || 0})</span>
          </button>

          <span className="px-3 py-1 rounded-full bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border font-label text-label-sm text-accent font-semibold">
            {event.status || 'Upcoming Tournament'}
          </span>
        </div>
      </header>

      {/* Main Grid (Lines 195-231) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 8 Columns: Hero & Content */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="rounded-lg overflow-hidden border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface shadow-sm">
            <BannerCarousel
              images={
                Array.isArray(event.bannerImages) && event.bannerImages.length > 0
                  ? event.bannerImages
                  : event.image
                    ? [event.image]
                    : []
              }
              title={event.title}
              heightClass="h-56 sm:h-80"
            />
            <div className="p-4 sm:p-6 flex flex-col gap-3">
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

          {/* Prizes & Awards */}
          {(event.championPrize || event.runnerUpPrize || event.mvpPrize || event.prizePool) && (
            <div className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-6 flex flex-col gap-4">
              <h2 className="font-headline text-title-md font-bold flex items-center gap-2">
                <FontAwesomeIcon icon={faTrophy} className="text-warning" />
                <span>Prizes &amp; Rewards</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {event.championPrize && (
                  <div className="p-3 rounded-md bg-warning/10 border border-warning/30">
                    <span className="font-label text-xs uppercase text-warning font-bold block">Champion</span>
                    <strong>{event.championPrize}</strong>
                  </div>
                )}
                {event.runnerUpPrize && (
                  <div className="p-3 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border">
                    <span className="font-label text-xs uppercase text-light-muted dark:text-dark-muted font-bold block">Runner-Up</span>
                    <strong>{event.runnerUpPrize}</strong>
                  </div>
                )}
                {event.mvpPrize && (
                  <div className="p-3 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border">
                    <span className="font-label text-xs uppercase text-light-muted dark:text-dark-muted font-bold block">MVP Award</span>
                    <strong>{event.mvpPrize}</strong>
                  </div>
                )}
                {event.prizePool && (
                  <div className="p-3 rounded-md bg-primary/10 border border-primary/30">
                    <span className="font-label text-xs uppercase text-primary font-bold block">Total Prize Pool</span>
                    <strong>{event.prizePool}</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tournament Features & Rules (One line per item with checkbox icons) */}
          <div className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-6 flex flex-col gap-5">
            <h2 className="font-headline text-title-md font-bold">Tournament Features &amp; Rules</h2>

            {event.features && (
              <div className="flex flex-col gap-2">
                <span className="font-label text-xs uppercase tracking-wider text-primary font-bold">
                  Features &amp; Included Amenities
                </span>
                <div className="flex flex-col gap-2">
                  {String(event.features)
                    .split('\n')
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .map((line, i) => (
                      <div key={`feat-${i}`} className="flex items-start gap-2.5 text-sm font-body">
                        <FontAwesomeIcon icon={faSquareCheck} className="text-primary text-sm mt-1 shrink-0" />
                        <span>{line}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {event.rules && (
              <div className="flex flex-col gap-2 pt-2 border-t border-light-border dark:border-dark-border">
                <span className="font-label text-xs uppercase tracking-wider text-secondary font-bold">
                  Official Rules &amp; Eligibility
                </span>
                <div className="flex flex-col gap-2">
                  {String(event.rules)
                    .split('\n')
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .map((line, i) => (
                      <div key={`rule-${i}`} className="flex items-start gap-2.5 text-sm font-body">
                        <FontAwesomeIcon icon={faSquareCheck} className="text-secondary text-sm mt-1 shrink-0" />
                        <span>{line}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-body text-body-md text-light-muted dark:text-dark-muted pt-2 border-t border-light-border dark:border-dark-border">
              <div className="flex items-center gap-2.5">
                <FontAwesomeIcon icon={faCircleCheck} className="text-primary text-sm shrink-0" />
                <span>Squad size: {event.teamSize || 7} players per team</span>
              </div>
              <div className="flex items-center gap-2.5">
                <FontAwesomeIcon icon={faCircleCheck} className="text-primary text-sm shrink-0" />
                <span>
                  Spectators:{' '}
                  {event.spectatorMode === 'NONE'
                    ? 'Players only'
                    : event.spectatorMode === 'LIMITED_TICKETS'
                      ? `${event.remainingSeats ?? 0} ticket seats remaining`
                      : 'Open for all visitors (Free)'}
                </span>
              </div>
            </div>
          </div>

          {/* Leaderboard, Match Results & Champions */}
          {(event.results || (event.standings && event.standings.length > 0) || (event.fixtures && event.fixtures.length > 0)) && (
            <div className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-4 sm:p-6 flex flex-col gap-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-headline text-title-md font-bold flex items-center gap-2">
                  <FontAwesomeIcon icon={faTrophy} className="text-primary" />
                  <span>Results &amp; Leaderboard</span>
                </h2>
                {event.status === 'COMPLETED' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-success/15 text-success font-label text-xs font-semibold">
                    Final Standings
                  </span>
                )}
              </div>

              {event.results && (event.results.champion || event.results.runnerUp || event.results.mvp || event.results.summary) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {event.results.champion && (
                    <div className="p-3 rounded-md bg-warning/10 border border-warning/30">
                      <span className="font-label text-[11px] uppercase text-warning font-bold block">Champion</span>
                      <strong className="text-sm">{event.results.champion}</strong>
                    </div>
                  )}
                  {event.results.runnerUp && (
                    <div className="p-3 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border">
                      <span className="font-label text-[11px] uppercase text-light-muted dark:text-dark-muted font-bold block">Runner-Up</span>
                      <strong className="text-sm">{event.results.runnerUp}</strong>
                    </div>
                  )}
                  {(event.results.mvp || event.results.topScorer) && (
                    <div className="p-3 rounded-md bg-primary/10 border border-primary/30">
                      <span className="font-label text-[11px] uppercase text-primary font-bold block">MVP / Top Performer</span>
                      <strong className="text-sm">{event.results.mvp || event.results.topScorer}</strong>
                    </div>
                  )}
                  {event.results.summary && (
                    <p className="sm:col-span-3 text-xs text-light-muted dark:text-dark-muted">
                      {event.results.summary}
                    </p>
                  )}
                </div>
              )}

              {Array.isArray(event.standings) && event.standings.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted uppercase font-label">
                        <th className="py-2 pr-3">#</th>
                        <th className="py-2 pr-3">Squad</th>
                        <th className="py-2 px-2 text-center">P</th>
                        <th className="py-2 px-2 text-center">W</th>
                        <th className="py-2 px-2 text-center">D</th>
                        <th className="py-2 px-2 text-center">L</th>
                        <th className="py-2 px-2 text-center">GD</th>
                        <th className="py-2 pl-2 text-right text-primary">Pts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-light-border dark:divide-dark-border tabular-nums">
                      {event.standings.map((row, idx) => (
                        <tr key={row.id || idx}>
                          <td className="py-2 pr-3 font-mono font-bold">{row.rank || idx + 1}</td>
                          <td className="py-2 pr-3 font-semibold">{row.teamName}</td>
                          <td className="py-2 px-2 text-center">{row.played}</td>
                          <td className="py-2 px-2 text-center text-success">{row.won}</td>
                          <td className="py-2 px-2 text-center">{row.drawn}</td>
                          <td className="py-2 px-2 text-center text-error">{row.lost}</td>
                          <td className="py-2 px-2 text-center">{(row.goalsFor || 0) - (row.goalsAgainst || 0)}</td>
                          <td className="py-2 pl-2 text-right font-bold text-primary">{row.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {Array.isArray(event.fixtures) && event.fixtures.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="font-label text-xs uppercase text-light-muted dark:text-dark-muted font-semibold">
                    Match Results
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {event.fixtures.map((fx, idx) => (
                      <div
                        key={fx.id || idx}
                        className="p-3 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border text-xs flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between text-[11px] text-light-muted dark:text-dark-muted">
                          <span className="font-semibold text-primary">{fx.round}</span>
                          <span>{fx.status}</span>
                        </div>
                        <div className="flex items-center justify-between font-semibold">
                          <span>{fx.teamA}</span>
                          <span className="font-mono px-2 py-0.5 rounded bg-light-surface dark:bg-dark-surface text-primary">
                            {fx.scoreA ?? '-'} : {fx.scoreB ?? '-'}
                          </span>
                          <span>{fx.teamB}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

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
        <aside className="lg:col-span-4 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-4 sm:p-6 flex flex-col gap-5 lg:sticky lg:top-20 shadow-sm">
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
                  Organized by {event.organizer?.name || event.organizerName || 'Verified Organizer'}
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
                {event.paymentMode === 'OPEN_FREE' || event.entryFee <= 0
                  ? 'Open / Free team entry'
                  : event.paymentMode === 'ONLINE_REQUIRED'
                    ? 'Immediate SSLCommerz online payment required'
                    : 'Optional: Pay online via SSLCommerz or at venue gate'}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            {event.spectatorMode !== 'NONE' && (
              <button
                type="button"
                onClick={() =>
                  navigate(ROUTES.TICKET_BOOKING.replace(':eventId', event.id))
                }
                className="w-full py-3 rounded-md bg-primary text-on-primary font-label text-label-lg font-semibold hover:opacity-90 transition-opacity shadow-sm flex items-center justify-center gap-2"
              >
                <FontAwesomeIcon icon={faTicket} className="text-sm" />
                <span>
                  {event.spectatorMode === 'LIMITED_TICKETS'
                    ? `Buy Spectator Tickets (BDT ${event.ticketPrice})`
                    : 'Get Free Spectator Pass'}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(true)}
              className="w-full py-2.5 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border text-light-on-surface dark:text-dark-on-surface font-label text-xs sm:text-sm font-semibold hover:border-primary transition-colors flex items-center justify-center gap-2"
            >
              <FontAwesomeIcon icon={faUsers} className="text-xs" />
              <span>Apply / Register Team Squad</span>
            </button>
          </div>
        </aside>
      </div>

      {/* Team Registration Modal with Teammates by Safety ID */}
      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title={`Apply Team for ${event.title}`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleRegisterTeam} className="flex flex-col gap-4">
          <div className="p-3 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border text-xs text-light-muted dark:text-dark-muted">
            Required squad size: <strong>{event.teamSize || 7} players</strong> (You as Captain +{' '}
            <strong>{Math.max(0, (event.teamSize || 7) - 1)}</strong> verified teammates by Safety ID).
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="font-label text-label-sm font-semibold">Team Name</span>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Uttara Thunderbolts"
                required
                className="w-full px-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-sm focus:border-primary focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="font-label text-label-sm font-semibold">Captain Phone</span>
              <input
                type="text"
                value={captainPhone}
                onChange={(e) => setCaptainPhone(e.target.value)}
                placeholder="+880 17..."
                required
                className="w-full px-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-sm focus:border-primary focus:outline-none"
              />
            </label>
          </div>

          {/* Squad Builder by Safety ID */}
          <div className="flex flex-col gap-2">
            <span className="font-label text-xs font-semibold flex items-center justify-between">
              <span>Squad Roster ({1 + teammates.length} / {event.teamSize || 7} players)</span>
              <span className="text-primary font-mono">Your Safety ID: {user?.safetyId || 'Sign in'}</span>
            </span>

            {/* Captain badge */}
            {user && (
              <div className="p-2 rounded bg-primary/10 border border-primary/30 flex items-center justify-between text-xs">
                <span>
                  <strong>1. {user.name || user.fullName}</strong> (Captain)
                </span>
                <span className="font-mono text-[11px] text-primary font-bold">{user.safetyId}</span>
              </div>
            )}

            {/* Teammate chips */}
            {teammates.map((tm, idx) => (
              <div
                key={tm.safetyId}
                className="p-2 rounded bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border flex items-center justify-between text-xs"
              >
                <span>
                  <strong>{idx + 2}. {tm.fullName}</strong>{' '}
                  <span className="font-mono text-secondary ml-1">({tm.safetyId})</span>
                </span>
                <button
                  type="button"
                  onClick={() => setTeammates((prev) => prev.filter((item) => item.safetyId !== tm.safetyId))}
                  className="text-error hover:opacity-75 p-1"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>
            ))}

            {1 + teammates.length < (event.teamSize || 7) && (
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={safetyInput}
                  onChange={(e) => setSafetyInput(e.target.value)}
                  placeholder="Enter teammate Safety ID (e.g. KH-ABC12345)"
                  className="flex-1 px-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-mono text-xs uppercase focus:border-primary focus:outline-none"
                />
                <button
                  type="button"
                  disabled={lookingUp}
                  onClick={handleAddTeammateBySafetyId}
                  className="px-3.5 py-2 rounded-md border border-primary text-primary font-label text-xs font-semibold hover:bg-primary/10 flex items-center gap-1 disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faPlus} />
                  <span>{lookingUp ? 'Checking...' : 'Add Player'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Payment Option */}
          {event.paymentMode === 'OPTIONAL_VENUE' && event.entryFee > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="font-label text-xs font-semibold flex items-center gap-1.5">
                <FontAwesomeIcon icon={faCreditCard} className="text-primary" />
                <span>Entry Fee Payment (BDT {event.entryFee})</span>
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPaymentPref('ONLINE')}
                  className={`p-2.5 rounded border text-left font-semibold ${
                    paymentPref === 'ONLINE' ? 'border-primary bg-primary/10 text-primary' : 'border-light-border dark:border-dark-border'
                  }`}
                >
                  Pay Online (SSLCommerz)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentPref('VENUE')}
                  className={`p-2.5 rounded border text-left font-semibold ${
                    paymentPref === 'VENUE' ? 'border-primary bg-primary/10 text-primary' : 'border-light-border dark:border-dark-border'
                  }`}
                >
                  Pay at Venue Check-In
                </button>
              </div>
            </div>
          )}

          {event.paymentMode === 'ONLINE_REQUIRED' && event.entryFee > 0 && (
            <div className="p-2.5 rounded bg-warning/10 border border-warning/30 text-xs text-warning font-semibold">
              Immediate SSLCommerz payment of BDT {event.entryFee} is required upon submission.
            </div>
          )}

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
              {registering
                ? 'Submitting...'
                : event.paymentMode === 'ONLINE_REQUIRED' && event.entryFee > 0
                  ? `Pay BDT ${event.entryFee} & Apply`
                  : 'Submit Team Application'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EventDetailsPage;
