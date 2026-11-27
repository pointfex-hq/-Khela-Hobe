import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faLocationDot,
  faClock,
  faUsers,
  faStar,
  faShieldHalved,
  faHandshakeAngle,
  faCheck,
  faCircleCheck,
  faCircleExclamation,
  faMessage,
  faShareNodes,
} from '@fortawesome/free-solid-svg-icons';
import { matchService } from '../../services/endpoints/matchService';
import { participantService } from '../../services/endpoints/participantService';
import { paymentService } from '../../services/endpoints/paymentService';
import { ratingService } from '../../services/endpoints/ratingService';
import { tokenService } from '../../utils/tokenService';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';
import Button from '../../components/common/Button';
import MatchChatBox from '../../components/chat/MatchChatBox';
import RatingWidgetModal, { StarSummaryBadge } from '../../components/common/RatingWidgetModal';
import toast from 'react-hot-toast';

export const MatchDetailsPage = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasJoined, setHasJoined] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [playerNote, setPlayerNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('sslcommerz');
  const [paying, setPaying] = useState(false);
  const [pledgingItemId, setPledgingItemId] = useState(null);
  const [pledgeQtyByItem, setPledgeQtyByItem] = useState({});
  const [newEquipName, setNewEquipName] = useState('');
  const [newEquipQty, setNewEquipQty] = useState(1);
  const [addingEquip, setAddingEquip] = useState(false);
  const [rateOrgOpen, setRateOrgOpen] = useState(false);
  const [orgRatings, setOrgRatings] = useState({ average: null, count: 0, reviews: [] });

  const loadOrganizerRatings = async (organizerId) => {
    if (!organizerId) return;
    try {
      const r = await ratingService.getRatings({
        targetUserId: organizerId,
        contextRole: 'PLAYER_TO_ORGANIZER',
      });
      if (r?.data) setOrgRatings(r.data);
    } catch {
      // ignore
    }
  };

  const reloadEquipment = async () => {
    try {
      const eqRes = await matchService.getMatchEquipment(matchId);
      if (Array.isArray(eqRes?.data)) {
        setMatch((prev) => (prev ? { ...prev, equipment: eqRes.data } : prev));
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const loadMatch = async () => {
      setLoading(true);
      try {
        const res = await matchService.getMatchById(matchId);
        let matchData = res.data;
        if (matchData && tokenService.getAccessToken()) {
          try {
            const [partRes, eqRes] = await Promise.all([
              participantService.getMatchParticipants(matchId),
              matchService.getMatchEquipment(matchId),
            ]);
            if (Array.isArray(partRes?.data) && partRes.data.length > 0) {
              matchData = { ...matchData, participants: partRes.data };
            }
            if (Array.isArray(eqRes?.data)) {
              matchData = { ...matchData, equipment: eqRes.data };
            }
          } catch {
            // Keep existing matchData if participant list is unavailable
          }
        }
        setMatch(matchData);
        if (matchData?.organizer?.id) {
          loadOrganizerRatings(matchData.organizer.id);
        }
        if (user?.id && Array.isArray(matchData?.participants)) {
          const joined = matchData.participants.some(
            (p) =>
              p.userId === user.id &&
              ['CONFIRMED', 'ATTENDED', 'CHECKED_IN', 'NO_SHOW'].includes(
                String(p.status || 'CONFIRMED').toUpperCase()
              )
          );
          setHasJoined(joined);
        }
      } catch (err) {
        console.error('Failed to load match details', err);
      } finally {
        setLoading(false);
      }
    };

    loadMatch();
  }, [matchId, user?.id]);

  if (loading) {
    return (
      <div className="p-12 text-center text-light-muted dark:text-dark-muted font-body">
        Loading match details...
      </div>
    );
  }

  if (!match) {
    return (
      <div className="p-12 text-center rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border">
        <h2 className="font-headline text-xl font-bold">Match not found</h2>
        <p className="font-body text-sm text-light-muted dark:text-dark-muted mt-2">
          The requested match may have concluded or been removed.
        </p>
        <Link to={ROUTES.EXPLORE_MATCHES} className="mt-4 inline-block">
          <Button variant="primary" size="md">
            Explore Other Matches
          </Button>
        </Link>
      </div>
    );
  }

  const slotsLeft = match.totalSlots - match.filledSlots;
  const isFull = slotsLeft <= 0 || match.joinMode === 'Match Full';
  const isHost = Boolean(user?.id && match.organizer?.id === user.id);
  const totalFee = Number(match.totalVenueFee ?? ((match.fee || 0) + (match.equipmentFee || 0)));
  const onlineCheckoutAllowed = Boolean(match.allowOnlinePayment !== false && totalFee > 0);

  const handleJoin = async () => {
    const useOnlinePayment =
      onlineCheckoutAllowed &&
      match.joinMode !== 'Approval Required' &&
      paymentMethod === 'sslcommerz';

    if (useOnlinePayment) {
      setPaying(true);
      try {
        const res = await paymentService.initiateSslcommerzPayment({
          purpose: 'MATCH_FEE',
          matchId: match.id,
          amount: totalFee,
          currency: 'BDT',
          productName: match.title,
        });
        if (res?.data?.gatewayUrl) {
          window.location.href = res.data.gatewayUrl;
          return;
        }
        toast.error('Payment gateway URL was not returned.');
      } catch (err) {
        toast.error(err?.message || 'Unable to start SSLCommerz checkout');
      } finally {
        setPaying(false);
      }
      return;
    }

    try {
      const res = await matchService.joinMatch(match.id, {
        mode: match.mode,
        isApprovalRequired: match.joinMode === 'Approval Required',
        message: playerNote,
        playerNote,
      });
      toast.success(res.message || 'Successfully registered for match!');
      setHasJoined(true);
      setJoinModalOpen(false);
      // Reload match
      const refreshed = await matchService.getMatchById(match.id);
      setMatch(refreshed.data);
    } catch (err) {
      toast.error(err?.message || 'Failed to join match');
    }
  };

  const handleLeave = async () => {
    try {
      const res = await matchService.leaveMatch(match.id);
      toast.success(res.message || 'Slot released');
      setHasJoined(false);
      const refreshed = await matchService.getMatchById(match.id);
      setMatch(refreshed.data);
    } catch {
      toast.error('Failed to update slot');
    }
  };

  const handlePledgeEquipment = async (item) => {
    if (!tokenService.getAccessToken()) {
      toast.error('Please sign in to contribute match equipment.');
      return;
    }
    const maxAllowed = Math.max(0, item.remaining + (item.userCommittedQty || 0));
    if (maxAllowed <= 0) return;
    const requestedQty = Math.min(maxAllowed, Math.max(1, Number(pledgeQtyByItem[item.id] || 1)));
    setPledgingItemId(item.id);
    try {
      const res = await matchService.pledgeEquipment(match.id, {
        itemId: item.id,
        quantity: requestedQty,
      });
      toast.success(res.message);
      await reloadEquipment();
    } catch (err) {
      toast.error(err?.message || 'Failed to contribute equipment');
    } finally {
      setPledgingItemId(null);
    }
  };

  const handleUnpledgeEquipment = async (item) => {
    setPledgingItemId(item.id);
    try {
      const res = await matchService.unpledgeEquipment(match.id, item.id);
      toast.success(res.message);
      await reloadEquipment();
    } catch (err) {
      toast.error(err?.message || 'Failed to withdraw equipment contribution');
    } finally {
      setPledgingItemId(null);
    }
  };

  const handleOrganizerAddEquipment = async (e) => {
    e.preventDefault();
    if (!newEquipName.trim()) return;
    setAddingEquip(true);
    try {
      await matchService.addMatchEquipment(match.id, {
        name: newEquipName.trim(),
        requiredQuantity: Number(newEquipQty) || 1,
      });
      setNewEquipName('');
      setNewEquipQty(1);
      toast.success('Equipment requirement added.');
      await reloadEquipment();
    } catch (err) {
      toast.error(err?.message || 'Failed to add equipment item.');
    } finally {
      setAddingEquip(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    toast.success('Match link copied to clipboard!');
  };

  return (
    <div className="flex flex-col gap-5 sm:gap-6 pb-20 lg:pb-6">
      {/* Top Back & Share Navigation */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 font-label text-sm font-semibold text-light-muted dark:text-dark-muted hover:text-primary transition-colors"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
          <span>Back to Matches</span>
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-light-border dark:border-dark-border text-xs font-label text-light-muted dark:text-dark-muted hover:border-primary transition-colors"
        >
          <FontAwesomeIcon icon={faShareNodes} className="text-xs" />
          <span>Share Match</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Details Column (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Header Card */}
          <div className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-4 sm:p-6 flex flex-col gap-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-light-surface-elevated dark:bg-dark-surface-elevated text-primary font-label text-label-sm font-semibold">
                {match.sport}
              </span>
              <span
                className={`px-3 py-1 rounded-full font-label text-label-sm font-bold ${
                  isFull
                    ? 'bg-error text-on-error'
                    : match.joinMode === 'Approval Required'
                    ? 'bg-warning text-on-warning'
                    : 'bg-success text-on-success'
                }`}
              >
                {isFull ? 'Match Full' : match.joinMode}
              </span>
              <span className="px-3 py-1 rounded-full bg-light-surface-elevated dark:bg-dark-surface-elevated text-light-on-surface dark:text-dark-on-surface font-label text-label-sm">
                {match.skillLevel}
              </span>
            </div>

            <h1 className="font-headline text-headline-lg font-bold text-light-on-surface dark:text-dark-on-surface tracking-tight">
              {match.title}
            </h1>

            <p className="font-body text-body-lg text-light-muted dark:text-dark-muted leading-relaxed">
              {match.description}
            </p>

            {match.image && (
              <img
                src={match.image}
                alt={match.title}
                className="w-full h-56 sm:h-72 object-cover rounded-md border border-light-border dark:border-dark-border mt-2"
              />
            )}
          </div>

          {/* Equipment Requirements & Match Contributions */}
          <section className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-4 sm:p-6 flex flex-col gap-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <h2 className="font-headline text-title-lg font-bold text-light-on-surface dark:text-dark-on-surface">
                Equipment Requirements &amp; Contributions
              </h2>
              <span className="font-body text-body-sm text-light-muted dark:text-dark-muted">
                Pledge gear you can bring to help the squad
              </span>
            </div>

            {isHost && (
              <form onSubmit={handleOrganizerAddEquipment} className="flex flex-col sm:flex-row gap-2 p-3 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border">
                <input
                  type="text"
                  value={newEquipName}
                  onChange={(e) => setNewEquipName(e.target.value)}
                  placeholder="Add required item (e.g. Match Football, Bibs, Cones)..."
                  className="flex-1 px-3 py-1.5 rounded bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border text-xs"
                />
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={newEquipQty}
                  onChange={(e) => setNewEquipQty(e.target.value)}
                  className="w-20 px-2.5 py-1.5 rounded bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border text-xs"
                />
                <button
                  type="submit"
                  disabled={addingEquip}
                  className="px-3.5 py-1.5 rounded bg-primary text-on-primary font-label text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {addingEquip ? 'Adding...' : '+ Add Gear'}
                </button>
              </form>
            )}

            {!match.equipment || match.equipment.length === 0 ? (
              <p className="font-body text-xs text-light-muted dark:text-dark-muted py-2">
                No specific player equipment contributions requested for this match.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {match.equipment.map((item) => {
                  const isFulfilled = item.remaining === 0;
                  const maxContrib = Math.max(1, item.remaining + (item.userCommittedQty || 0));
                  const selectedContribQty = pledgeQtyByItem[item.id] ?? (item.userCommittedQty || 1);
                  const isBusy = pledgingItemId === item.id;

                  return (
                    <div
                      key={item.id}
                      className="rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border p-4 flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-title text-title-md font-bold text-light-on-surface dark:text-dark-on-surface">
                          {item.name}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-label text-label-sm font-bold tabular-nums shrink-0 ${
                            isFulfilled ? 'bg-success text-on-success' : 'bg-warning text-on-warning'
                          }`}
                        >
                          {isFulfilled ? 'Fulfilled' : `${item.remaining} needed`}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center pt-1">
                        <div className="p-2 rounded bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border">
                          <p className="font-label text-xs text-light-muted dark:text-dark-muted">Required</p>
                          <p className="font-headline text-base font-bold tabular-nums">{item.required}</p>
                        </div>
                        <div className="p-2 rounded bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border">
                          <p className="font-label text-xs text-light-muted dark:text-dark-muted">Committed</p>
                          <p className="font-headline text-base font-bold tabular-nums text-success">{item.committed}</p>
                        </div>
                        <div className="p-2 rounded bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border">
                          <p className="font-label text-xs text-light-muted dark:text-dark-muted">Remaining</p>
                          <p className={`font-headline text-base font-bold tabular-nums ${item.remaining > 0 ? 'text-accent' : 'text-light-muted dark:text-dark-muted'}`}>
                            {item.remaining}
                          </p>
                        </div>
                      </div>

                      {/* Real Player Contributors List */}
                      {Array.isArray(item.contributors) && item.contributors.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {item.contributors.map((c) => (
                            <span
                              key={c.id || c.userId}
                              className="px-2 py-0.5 rounded-full bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-[11px] font-medium"
                            >
                              {c.name} ×{c.quantity}
                            </span>
                          ))}
                        </div>
                      )}

                      {item.userPledged ? (
                        <div className="flex flex-col gap-2">
                          <div className="py-1.5 px-3 rounded-md bg-success/10 border border-success/20 text-success font-label text-xs font-semibold flex items-center justify-between gap-2">
                            <span className="flex items-center gap-1.5">
                              <FontAwesomeIcon icon={faCheck} />
                              <span>You pledged {item.userCommittedQty || 1}×</span>
                            </span>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleUnpledgeEquipment(item)}
                              className="text-error hover:underline text-[11px] disabled:opacity-50"
                            >
                              Withdraw
                            </button>
                          </div>
                        </div>
                      ) : isFulfilled ? (
                        <button
                          type="button"
                          disabled
                          className="w-full py-2 rounded-md bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted font-label text-xs cursor-not-allowed"
                        >
                          All Committed
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max={maxContrib}
                            value={selectedContribQty}
                            onChange={(e) =>
                              setPledgeQtyByItem((prev) => ({
                                ...prev,
                                [item.id]: Math.max(1, Math.min(maxContrib, Number(e.target.value) || 1)),
                              }))
                            }
                            aria-label={`Quantity to contribute for ${item.name}`}
                            className="w-16 px-2 py-1.5 rounded-md bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-xs text-center font-mono"
                          />
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handlePledgeEquipment(item)}
                            className="flex-1 py-2 rounded-md bg-primary text-on-primary font-label text-xs font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 disabled:opacity-50"
                          >
                            <FontAwesomeIcon icon={faHandshakeAngle} className="text-xs" />
                            <span>{isBusy ? 'Saving...' : `Contribute ${selectedContribQty} Item${selectedContribQty > 1 ? 's' : ''}`}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Current Participant List (Reference lines 371-410) */}
          <section className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-6 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-headline text-title-lg font-bold text-light-on-surface dark:text-dark-on-surface">
                Participants ({match.filledSlots} / {match.totalSlots})
              </h2>
              <span className="font-label text-label-md text-success font-bold tabular-nums">
                {slotsLeft > 0 ? `${slotsLeft} slot${slotsLeft > 1 ? 's' : ''} remaining` : 'Roster full'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {match.participants?.map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={p.avatar}
                      alt={p.name}
                      className="w-9 h-9 rounded-full object-cover shrink-0 border border-primary/40"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-label text-sm font-bold text-light-on-surface dark:text-dark-on-surface truncate">
                        {p.name}
                      </p>
                      <p className="font-body text-xs text-light-muted dark:text-dark-muted truncate">
                        {p.role}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-label font-semibold bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border shrink-0">
                    {p.skill}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar Action Column (4 Cols) */}
        <aside className="lg:col-span-4 flex flex-col gap-6">
          {/* Join / Reserved Action Card */}
          <div className="rounded-lg bg-light-surface dark:bg-dark-surface border-2 border-primary p-4 sm:p-6 flex flex-col gap-5 shadow-md lg:sticky lg:top-24">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="font-label text-xs uppercase tracking-wider text-light-muted dark:text-dark-muted font-semibold">
                  Match Fee
                </span>
                <p className="font-headline text-2xl font-bold text-light-on-surface dark:text-dark-on-surface tabular-nums">
                  {totalFee > 0 ? `BDT ${totalFee}` : 'Free Pick-up'}
                </p>
                {(match.fee > 0 || match.equipmentFee > 0) && (
                  <p className="text-[11px] text-light-muted dark:text-dark-muted tabular-nums">
                    Turf: BDT {match.fee || 0}
                    {match.equipmentFee > 0 ? ` + Gear: BDT ${match.equipmentFee}` : ''}
                  </p>
                )}
              </div>
              <span className="px-2.5 py-1 rounded-full bg-light-surface-elevated dark:bg-dark-surface-elevated text-primary font-label text-xs font-semibold shrink-0">
                {onlineCheckoutAllowed ? 'Online or Venue' : 'Venue Only'}
              </span>
            </div>

            {hasJoined ? (
              <div className="flex flex-col gap-3">
                <div className="p-3.5 rounded-md bg-success/10 border border-success/20 flex items-center gap-2.5 text-success text-xs font-label font-semibold">
                  <FontAwesomeIcon icon={faCircleCheck} className="text-sm" />
                  <span>Your slot is confirmed for this match!</span>
                </div>
                <button
                  type="button"
                  onClick={() => setChatOpen(true)}
                  className="w-full py-2.5 rounded-md bg-primary text-on-primary font-label text-xs font-semibold hover:opacity-90 flex items-center justify-center gap-1.5"
                >
                  <FontAwesomeIcon icon={faMessage} className="text-xs" />
                  <span>Open Squad Group Chat</span>
                </button>
                <Link to={ROUTES.PLAYER_TICKETS}>
                  <Button variant="secondary" size="md" fullWidth>
                    View Match Ticket / Pass
                  </Button>
                </Link>
                <button
                  type="button"
                  onClick={handleLeave}
                  className="font-label text-xs text-error hover:underline text-center mt-1"
                >
                  Release My Slot
                </button>
              </div>
            ) : isHost ? (
              <div className="flex flex-col gap-3">
                <div className="p-3.5 rounded-md bg-primary/10 border border-primary/20 text-primary text-xs font-label font-semibold">
                  You are organizing this match.
                </div>
                <button
                  type="button"
                  onClick={() => setChatOpen(true)}
                  className="w-full py-2.5 rounded-md bg-primary text-on-primary font-label text-xs font-semibold hover:opacity-90 flex items-center justify-center gap-1.5"
                >
                  <FontAwesomeIcon icon={faMessage} className="text-xs" />
                  <span>Open Squad Group Chat</span>
                </button>
              </div>
            ) : isFull ? (
              <div className="flex flex-col gap-2">
                <div className="p-3 rounded-md bg-error/10 border border-error/20 flex items-center gap-2 text-error text-xs font-body">
                  <FontAwesomeIcon icon={faCircleExclamation} />
                  <span>This match is currently at full capacity.</span>
                </div>
                <Button variant="tertiary" size="md" fullWidth disabled>
                  Roster Full
                </Button>
              </div>
            ) : (
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => setJoinModalOpen(true)}
                className="py-3.5 font-label text-base font-bold shadow-md"
              >
                {match.joinMode === 'Approval Required' ? 'Apply to Join' : 'Join Match Now'}
              </Button>
            )}

            {/* Quick Details List */}
            <div className="flex flex-col gap-3 pt-3 border-t border-light-border dark:border-dark-border text-xs text-light-muted dark:text-dark-muted">
              <div className="flex items-start gap-2.5">
                <FontAwesomeIcon icon={faClock} className="text-primary text-xs mt-0.5 shrink-0" />
                <span className="tabular-nums text-light-on-surface dark:text-dark-on-surface font-medium">
                  {match.schedule}
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <FontAwesomeIcon icon={faLocationDot} className="text-primary text-xs mt-0.5 shrink-0" />
                <span>
                  <strong className="text-light-on-surface dark:text-dark-on-surface block">{match.venue}</strong>
                  {match.area}, Bangladesh
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <FontAwesomeIcon icon={faShieldHalved} className="text-secondary dark:text-primary text-xs mt-0.5 shrink-0" />
                <span>Surface: {match.surfaceType}</span>
              </div>
            </div>
          </div>

          {/* Organizer Profile Card */}
          <div className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-5 flex flex-col gap-4 shadow-sm">
            <span className="font-label text-xs uppercase tracking-wider text-light-muted dark:text-dark-muted font-semibold">
              Host Organizer
            </span>

            <div className="flex items-center gap-3">
              <img
                src={match.organizer?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'}
                alt={match.organizer?.name}
                className="w-12 h-12 rounded-full object-cover border border-primary/50"
              />
              <div>
                <h4 className="font-title text-base font-bold text-light-on-surface dark:text-dark-on-surface">
                  {match.organizer?.name}
                </h4>
                <div className="flex items-center gap-2 text-xs text-light-muted dark:text-dark-muted mt-0.5">
                  <StarSummaryBadge
                    average={orgRatings.average ?? match.organizer?.rating}
                    count={orgRatings.count ?? match.organizer?.ratingCount ?? 0}
                  />
                  {match.organizer?.matchesHosted ? (
                    <>
                      <span>•</span>
                      <span>{match.organizer.matchesHosted} hosted</span>
                    </>
                  ) : null}
                </div>
              </div>
            </div>

            <p className="font-body text-xs text-light-muted dark:text-dark-muted">
              Organized under Khela Hobe verified host standards. Dedicated to on-time kickoffs and fair sportsmanship.
            </p>

            {orgRatings.reviews && orgRatings.reviews.length > 0 && (
              <div className="flex flex-col gap-1.5 p-2.5 rounded bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border text-[11px]">
                {orgRatings.reviews.slice(0, 2).map((rev) => (
                  <div key={rev.id} className="flex items-start justify-between gap-2">
                    <span className="text-light-muted dark:text-dark-muted">
                      <strong className="text-light-on-surface dark:text-dark-on-surface">{rev.raterName}:</strong>{' '}
                      {rev.comment || 'Well-organized match'}
                    </span>
                    <span className="font-mono font-bold text-warning shrink-0">{rev.score}★</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-2">
              {hasJoined && !isHost && match.organizer?.id && (
                <button
                  type="button"
                  onClick={() => setRateOrgOpen(true)}
                  className="w-full py-2 rounded-md border border-warning/60 bg-warning/10 text-warning font-label text-xs font-semibold hover:bg-warning/20 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <FontAwesomeIcon icon={faStar} className="text-xs" />
                  <span>Rate Host Organizer</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setChatOpen((prev) => !prev)}
                className="w-full py-2 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border font-label text-xs font-semibold text-light-on-surface dark:text-dark-on-surface hover:border-primary flex items-center justify-center gap-1.5 transition-colors"
              >
                <FontAwesomeIcon icon={faMessage} className="text-primary text-xs" />
                <span>{chatOpen ? 'Hide Chat Box' : 'Contact Organizer / Match Chat'}</span>
              </button>
            </div>
          </div>

          {chatOpen && (
            <MatchChatBox
              matchId={match.id}
              matchTitle={match.title}
              initialMode={hasJoined || isHost ? 'group' : 'dm'}
              onClose={() => setChatOpen(false)}
            />
          )}
        </aside>
      </div>

      {/* Join / Apply Modal */}
      {joinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-dark-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-5 sm:p-6 flex flex-col gap-4 sm:gap-5 shadow-2xl max-h-[90dvh] overflow-y-auto pb-safe">
            <div>
              <h3 className="font-headline text-headline-md font-bold text-light-on-surface dark:text-dark-on-surface">
                {match.joinMode === 'Approval Required' ? 'Submit Match Application' : 'Confirm Your Slot'}
              </h3>
              <p className="font-body text-sm text-light-muted dark:text-dark-muted mt-1">
                {match.title} • {match.schedule}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-label text-xs font-semibold text-light-on-surface dark:text-dark-on-surface">
                Note for Organizer (optional)
              </label>
              <textarea
                rows={3}
                value={playerNote}
                onChange={(e) => setPlayerNote(e.target.value)}
                placeholder="Mention preferred position, pledge gear, or arrival ETA..."
                className="w-full px-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border text-sm font-body text-light-on-background dark:text-dark-on-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="p-3 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border text-xs text-light-muted dark:text-dark-muted flex flex-col gap-2">
              <div className="flex justify-between">
                <span>Turf Fee</span>
                <span className="font-bold text-light-on-surface dark:text-dark-on-surface">
                  {match.fee > 0 ? `BDT ${match.fee}` : 'Free'}
                </span>
              </div>
              {match.equipmentFee > 0 && (
                <div className="flex justify-between">
                  <span>Equipment Fee</span>
                  <span className="font-bold text-light-on-surface dark:text-dark-on-surface">
                    BDT {match.equipmentFee}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-1 border-t border-light-border/60 dark:border-dark-border/60">
                <span>Total Fee</span>
                <span className="font-bold text-primary">
                  {totalFee > 0 ? `BDT ${totalFee}` : 'Free'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Cancellation Deadline</span>
                <span>2 hours prior to kickoff</span>
              </div>
            </div>

            {totalFee > 0 && match.joinMode !== 'Approval Required' && (
              onlineCheckoutAllowed ? (
                <div className="flex flex-col gap-2">
                  <span className="font-label text-xs font-semibold text-light-on-surface dark:text-dark-on-surface">
                    Payment Method
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('sslcommerz')}
                      className={`p-2.5 rounded-md border font-label font-semibold transition-colors ${
                        paymentMethod === 'sslcommerz'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted'
                      }`}
                    >
                      SSLCommerz Online
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('venue')}
                      className={`p-2.5 rounded-md border font-label font-semibold transition-colors ${
                        paymentMethod === 'venue'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted'
                      }`}
                    >
                      Pay at Venue
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-md bg-warning/10 border border-warning/30 text-warning text-xs font-medium">
                  Quick Match Host fixture: Pay turf &amp; equipment fees directly at the venue.
                </div>
              )
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="tertiary"
                size="md"
                onClick={() => setJoinModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                loading={paying}
                onClick={handleJoin}
              >
                {match.joinMode === 'Approval Required'
                  ? 'Send Request'
                  : onlineCheckoutAllowed && paymentMethod === 'sslcommerz'
                  ? `Pay BDT ${totalFee} & Join`
                  : 'Confirm & Reserve'}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Sticky Mobile Bottom Join / Chat Action Bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-light-border dark:border-dark-border bg-light-surface/95 dark:bg-dark-surface/95 backdrop-blur-md px-4 pt-2.5 pb-safe flex items-center justify-between gap-3 shadow-2xl">
        <div className="min-w-0">
          <p className="font-headline text-sm font-bold text-light-on-surface dark:text-dark-on-surface tabular-nums truncate">
            {match.fee > 0 ? `BDT ${match.fee}` : 'Free Pick-up'}
          </p>
          <p className="font-body text-[11px] text-light-muted dark:text-dark-muted tabular-nums">
            {slotsLeft > 0 ? `${slotsLeft} slot${slotsLeft === 1 ? '' : 's'} left` : 'Roster full'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setChatOpen(true)}
            aria-label="Open match chat"
            className="w-10 h-10 rounded-md border border-light-border dark:border-dark-border bg-light-surface-elevated dark:bg-dark-surface-elevated flex items-center justify-center text-primary"
          >
            <FontAwesomeIcon icon={faMessage} className="text-sm" />
          </button>

          {hasJoined ? (
            <Button variant="secondary" size="md" onClick={() => setChatOpen(true)}>
              Squad Chat
            </Button>
          ) : isHost ? (
            <Button variant="primary" size="md" onClick={() => setChatOpen(true)}>
              Host Chat
            </Button>
          ) : isFull ? (
            <Button variant="tertiary" size="md" disabled>
              Roster Full
            </Button>
          ) : (
            <Button variant="primary" size="md" onClick={() => setJoinModalOpen(true)}>
              {match.joinMode === 'Approval Required' ? 'Apply Now' : 'Join Match'}
            </Button>
          )}
        </div>
      </div>

      <RatingWidgetModal
        isOpen={rateOrgOpen}
        onClose={() => setRateOrgOpen(false)}
        targetUserId={match.organizer?.id}
        targetName={match.organizer?.name}
        matchId={match.id}
        contextRole="PLAYER_TO_ORGANIZER"
        onSubmitted={() => loadOrganizerRatings(match.organizer?.id)}
      />
    </div>
  );
};

export default MatchDetailsPage;
