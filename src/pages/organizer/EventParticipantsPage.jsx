import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faUsers,
  faCheck,
  faXmark,
  faTrashCan,
  faShieldHalved,
  faMoneyBillWave,
  faTrophy,
  faPlus,
  faFloppyDisk,
  faRankingStar,
} from '@fortawesome/free-solid-svg-icons';
import { eventService } from '../../services/endpoints/eventService';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../constants/roles';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { toastService } from '../../components/feedback/toastService';
import { ROUTES } from '../../constants/routes';

export const EventParticipantsPage = () => {
  const { eventId } = useParams();
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState('squads'); // 'squads' | 'results'
  const [event, setEvent] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  // Results & Leaderboard editor state
  const [standings, setStandings] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [champion, setChampion] = useState('');
  const [runnerUp, setRunnerUp] = useState('');
  const [thirdPlace, setThirdPlace] = useState('');
  const [mvp, setMvp] = useState('');
  const [topScorer, setTopScorer] = useState('');
  const [summary, setSummary] = useState('');
  const [markCompleted, setMarkCompleted] = useState(false);
  const [savingResults, setSavingResults] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [evtRes, partRes] = await Promise.all([
        eventService.getEventDetails(eventId),
        eventService.getEventParticipants(eventId),
      ]);
      const ev = evtRes?.data || null;
      setEvent(ev);
      setTeams(partRes?.data || []);
      if (ev) {
        setStandings(Array.isArray(ev.standings) ? ev.standings : []);
        setFixtures(Array.isArray(ev.fixtures) ? ev.fixtures : []);
        setChampion(ev.results?.champion || '');
        setRunnerUp(ev.results?.runnerUp || '');
        setThirdPlace(ev.results?.thirdPlace || '');
        setMvp(ev.results?.mvp || '');
        setTopScorer(ev.results?.topScorer || '');
        setSummary(ev.results?.summary || '');
        setMarkCompleted(ev.status === 'COMPLETED');
      }
    } catch {
      toastService.error('Failed to load tournament console data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [eventId]);

  const handleStatusUpdate = async (team, payload, label) => {
    setBusyId(team.id);
    try {
      await eventService.updateRegistration(eventId, team.id, payload);
      toastService.success(label);
      await loadData();
    } catch (err) {
      toastService.error(err?.message || 'Action failed.');
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (team) => {
    setBusyId(team.id);
    try {
      await eventService.removeRegistration(eventId, team.id);
      toastService.success(`Removed team "${team.teamName}".`);
      await loadData();
    } catch (err) {
      toastService.error(err?.message || 'Failed to remove team.');
    } finally {
      setBusyId(null);
    }
  };

  const handleImportConfirmedTeams = () => {
    const existingNames = new Set(standings.map((s) => String(s.teamName).toLowerCase()));
    const toAdd = teams
      .filter((t) => !existingNames.has(String(t.teamName).toLowerCase()))
      .map((t, idx) => ({
        id: `st-${Date.now()}-${idx}`,
        teamName: t.teamName,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
      }));
    if (toAdd.length === 0) {
      toastService.info('All registered squads are already in the leaderboard.');
      return;
    }
    setStandings((prev) => [...prev, ...toAdd]);
    toastService.success(`Added ${toAdd.length} registered squad(s) to standings.`);
  };

  const handleAddStandingRow = () => {
    setStandings((prev) => [
      ...prev,
      {
        id: `st-${Date.now()}`,
        teamName: '',
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
      },
    ]);
  };

  const handleAddFixture = () => {
    setFixtures((prev) => [
      ...prev,
      {
        id: `fx-${Date.now()}`,
        round: 'Group Stage',
        teamA: '',
        teamB: '',
        scoreA: 0,
        scoreB: 0,
        status: 'FINAL',
      },
    ]);
  };

  const handleSaveResults = async (e) => {
    e.preventDefault();
    setSavingResults(true);
    try {
      await eventService.updateTournamentResults(eventId, {
        standings: standings
          .filter((s) => String(s.teamName || '').trim())
          .map((s) => ({
            ...s,
            teamName: String(s.teamName).trim(),
            played: Number(s.played) || 0,
            won: Number(s.won) || 0,
            drawn: Number(s.drawn) || 0,
            lost: Number(s.lost) || 0,
            goalsFor: Number(s.goalsFor) || 0,
            goalsAgainst: Number(s.goalsAgainst) || 0,
            points: Number(s.points) || 0,
          })),
        fixtures: fixtures
          .filter((f) => String(f.teamA || '').trim() && String(f.teamB || '').trim())
          .map((f) => ({
            ...f,
            round: f.round || 'Matchday',
            teamA: String(f.teamA).trim(),
            teamB: String(f.teamB).trim(),
            scoreA: f.scoreA === '' || f.scoreA === null ? null : Number(f.scoreA),
            scoreB: f.scoreB === '' || f.scoreB === null ? null : Number(f.scoreB),
            status: f.status || 'FINAL',
          })),
        results: {
          champion: champion.trim() || null,
          runnerUp: runnerUp.trim() || null,
          thirdPlace: thirdPlace.trim() || null,
          mvp: mvp.trim() || null,
          topScorer: topScorer.trim() || null,
          summary: summary.trim() || null,
        },
        markCompleted,
      });
      toastService.success('Tournament leaderboard, results & awards published!');
      await loadData();
    } catch (err) {
      toastService.error(err?.message || 'Failed to save tournament results.');
    } finally {
      setSavingResults(false);
    }
  };

  const backRoute = role === ROLES.ADMIN ? ROUTES.ADMIN_TOURNAMENTS : ROUTES.ORGANIZER_EVENTS;

  return (
    <div className="max-w-6xl w-full mx-auto flex flex-col gap-6 pb-12">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-light-border dark:border-dark-border pb-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to={backRoute}
            className="w-9 h-9 rounded-md border border-light-border dark:border-dark-border flex items-center justify-center hover:border-primary shrink-0"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
          </Link>
          <div className="min-w-0">
            <h1 className="font-headline text-lg sm:text-title-lg font-bold truncate">
              Tournament Squads &amp; Results Console
            </h1>
            <p className="font-body text-xs text-light-muted dark:text-dark-muted truncate">
              {event ? `${event.title} • ${event.teamSize} players/squad` : 'Loading...'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('squads')}
            className={`px-3.5 py-2 rounded-md font-label text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'squads'
                ? 'bg-primary text-on-primary'
                : 'bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border'
            }`}
          >
            <FontAwesomeIcon icon={faUsers} />
            <span>Squads ({teams.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('results')}
            className={`px-3.5 py-2 rounded-md font-label text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'results'
                ? 'bg-primary text-on-primary'
                : 'bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border'
            }`}
          >
            <FontAwesomeIcon icon={faRankingStar} />
            <span>Results &amp; Leaderboard</span>
          </button>
        </div>
      </header>

      {loading ? (
        <div className="py-16 flex justify-center">
          <LoadingSpinner size="lg" message="Loading tournament console..." />
        </div>
      ) : activeTab === 'results' ? (
        <form onSubmit={handleSaveResults} className="flex flex-col gap-6">
          {/* Champions & Podium Awards */}
          <section className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-4 sm:p-6 flex flex-col gap-4">
            <h2 className="font-headline text-base font-bold flex items-center gap-2">
              <FontAwesomeIcon icon={faTrophy} className="text-warning" />
              <span>Official Results &amp; Champions</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <label className="flex flex-col gap-1">
                <span className="font-label text-xs font-semibold">Champion Team</span>
                <input
                  type="text"
                  value={champion}
                  onChange={(e) => setChampion(e.target.value)}
                  placeholder="e.g. Banani United"
                  className="px-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border text-sm"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-label text-xs font-semibold">Runner-Up Team</span>
                <input
                  type="text"
                  value={runnerUp}
                  onChange={(e) => setRunnerUp(e.target.value)}
                  placeholder="e.g. Uttara Strikers"
                  className="px-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border text-sm"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-label text-xs font-semibold">MVP / Top Performer</span>
                <input
                  type="text"
                  value={mvp}
                  onChange={(e) => setMvp(e.target.value)}
                  placeholder="e.g. Rafiq Ahmed"
                  className="px-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border text-sm"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-label text-xs font-semibold">Top Scorer / Highlight</span>
                <input
                  type="text"
                  value={topScorer}
                  onChange={(e) => setTopScorer(e.target.value)}
                  placeholder="e.g. Tanvir (8 goals)"
                  className="px-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border text-sm"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-label text-xs font-semibold">3rd Place (Optional)</span>
                <input
                  type="text"
                  value={thirdPlace}
                  onChange={(e) => setThirdPlace(e.target.value)}
                  className="px-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border text-sm"
                />
              </label>
              <label className="flex items-center gap-2.5 pt-5 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={markCompleted}
                  onChange={(e) => setMarkCompleted(e.target.checked)}
                  className="accent-primary w-4 h-4"
                />
                <span>Mark Tournament as COMPLETED</span>
              </label>
            </div>
            <label className="flex flex-col gap-1">
              <span className="font-label text-xs font-semibold">Official Summary Notes</span>
              <textarea
                rows={2}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Matchday highlights, penalty shootout summary, or closing remarks..."
                className="px-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border text-sm resize-none"
              />
            </label>
          </section>

          {/* Leaderboard / Points Table */}
          <section className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-4 sm:p-6 flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-headline text-base font-bold">Leaderboard / Standings</h2>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleImportConfirmedTeams}
                  className="px-3 py-1.5 rounded-md border border-secondary text-secondary font-label text-xs font-semibold hover:bg-secondary/10"
                >
                  Import Registered Squads
                </button>
                <button
                  type="button"
                  onClick={handleAddStandingRow}
                  className="px-3 py-1.5 rounded-md border border-primary text-primary font-label text-xs font-semibold hover:bg-primary/10 flex items-center gap-1"
                >
                  <FontAwesomeIcon icon={faPlus} />
                  <span>Add Team Row</span>
                </button>
              </div>
            </div>

            {standings.length === 0 ? (
              <p className="text-xs text-light-muted dark:text-dark-muted">
                No leaderboard rows yet. Import registered squads or add rows to track standings.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs min-w-[540px]">
                  <thead>
                    <tr className="border-b border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted font-label uppercase">
                      <th className="py-2 pr-2">Team Name</th>
                      <th className="py-2 px-1 w-14">P</th>
                      <th className="py-2 px-1 w-14">W</th>
                      <th className="py-2 px-1 w-14">D</th>
                      <th className="py-2 px-1 w-14">L</th>
                      <th className="py-2 px-1 w-14">GF</th>
                      <th className="py-2 px-1 w-14">GA</th>
                      <th className="py-2 px-1 w-16 text-primary">Pts</th>
                      <th className="py-2 pl-2 text-right">Remove</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-light-border dark:divide-dark-border">
                    {standings.map((row, idx) => (
                      <tr key={row.id || idx}>
                        <td className="py-2 pr-2">
                          <input
                            type="text"
                            value={row.teamName}
                            onChange={(e) =>
                              setStandings((prev) =>
                                prev.map((r, i) => (i === idx ? { ...r, teamName: e.target.value } : r))
                              )
                            }
                            placeholder="Squad name"
                            className="w-full px-2 py-1 rounded bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border"
                          />
                        </td>
                        {['played', 'won', 'drawn', 'lost', 'goalsFor', 'goalsAgainst', 'points'].map(
                          (field) => (
                            <td key={field} className="py-2 px-1">
                              <input
                                type="number"
                                min="0"
                                value={row[field] ?? 0}
                                onChange={(e) =>
                                  setStandings((prev) =>
                                    prev.map((r, i) =>
                                      i === idx ? { ...r, [field]: Number(e.target.value) || 0 } : r
                                    )
                                  )
                                }
                                className="w-14 px-1.5 py-1 rounded bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border text-center font-mono"
                              />
                            </td>
                          )
                        )}
                        <td className="py-2 pl-2 text-right">
                          <button
                            type="button"
                            onClick={() => setStandings((prev) => prev.filter((_, i) => i !== idx))}
                            className="text-error p-1"
                          >
                            <FontAwesomeIcon icon={faTrashCan} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Match Fixtures & Scores */}
          <section className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-4 sm:p-6 flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-headline text-base font-bold">Match Fixtures &amp; Scores</h2>
              <button
                type="button"
                onClick={handleAddFixture}
                className="px-3 py-1.5 rounded-md border border-primary text-primary font-label text-xs font-semibold hover:bg-primary/10 flex items-center gap-1"
              >
                <FontAwesomeIcon icon={faPlus} />
                <span>Add Match Score</span>
              </button>
            </div>

            {fixtures.length === 0 ? (
              <p className="text-xs text-light-muted dark:text-dark-muted">
                No match results recorded yet. Add fixtures above to publish live or final scores.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {fixtures.map((fx, idx) => (
                  <div
                    key={fx.id || idx}
                    className="p-3 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border grid grid-cols-1 sm:grid-cols-12 gap-2 items-center text-xs"
                  >
                    <input
                      type="text"
                      value={fx.round}
                      onChange={(e) =>
                        setFixtures((prev) => prev.map((f, i) => (i === idx ? { ...f, round: e.target.value } : f)))
                      }
                      placeholder="Round"
                      className="sm:col-span-2 px-2 py-1.5 rounded bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border"
                    />
                    <input
                      type="text"
                      value={fx.teamA}
                      onChange={(e) =>
                        setFixtures((prev) => prev.map((f, i) => (i === idx ? { ...f, teamA: e.target.value } : f)))
                      }
                      placeholder="Team A"
                      className="sm:col-span-3 px-2 py-1.5 rounded bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border"
                    />
                    <div className="sm:col-span-2 flex items-center justify-center gap-1">
                      <input
                        type="number"
                        min="0"
                        value={fx.scoreA ?? ''}
                        onChange={(e) =>
                          setFixtures((prev) => prev.map((f, i) => (i === idx ? { ...f, scoreA: e.target.value } : f)))
                        }
                        className="w-12 px-1 py-1.5 rounded bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-center font-mono"
                      />
                      <span>:</span>
                      <input
                        type="number"
                        min="0"
                        value={fx.scoreB ?? ''}
                        onChange={(e) =>
                          setFixtures((prev) => prev.map((f, i) => (i === idx ? { ...f, scoreB: e.target.value } : f)))
                        }
                        className="w-12 px-1 py-1.5 rounded bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-center font-mono"
                      />
                    </div>
                    <input
                      type="text"
                      value={fx.teamB}
                      onChange={(e) =>
                        setFixtures((prev) => prev.map((f, i) => (i === idx ? { ...f, teamB: e.target.value } : f)))
                      }
                      placeholder="Team B"
                      className="sm:col-span-3 px-2 py-1.5 rounded bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border"
                    />
                    <div className="sm:col-span-2 flex items-center justify-end gap-1.5">
                      <select
                        value={fx.status}
                        onChange={(e) =>
                          setFixtures((prev) => prev.map((f, i) => (i === idx ? { ...f, status: e.target.value } : f)))
                        }
                        className="px-2 py-1.5 rounded bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border"
                      >
                        <option value="FINAL">Final</option>
                        <option value="LIVE">Live</option>
                        <option value="SCHEDULED">Scheduled</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => setFixtures((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-error p-1"
                      >
                        <FontAwesomeIcon icon={faTrashCan} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingResults}
              className="px-6 py-2.5 rounded-md bg-primary text-on-primary font-label text-sm font-bold hover:opacity-90 flex items-center gap-2 disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faFloppyDisk} />
              <span>{savingResults ? 'Publishing...' : 'Publish Results & Leaderboard'}</span>
            </button>
          </div>
        </form>
      ) : teams.length === 0 ? (
        <EmptyState
          icon={faUsers}
          title="No teams have applied yet"
          description="Submitted teams with verified teammate Safety IDs will appear here for review."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {teams.map((team) => (
            <article
              key={team.id}
              className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-4 sm:p-5 flex flex-col gap-4 shadow-sm"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-headline text-lg font-bold">{team.teamName}</h2>
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-label text-xs font-semibold ${
                        team.status === 'CONFIRMED'
                          ? 'bg-success text-on-success'
                          : team.status === 'REJECTED'
                            ? 'bg-error/15 text-error'
                            : 'bg-warning/20 text-warning'
                      }`}
                    >
                      {team.status}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-primary/15 text-primary font-label text-xs font-semibold">
                      Fee: {team.paymentStatus}
                    </span>
                  </div>
                  <p className="font-body text-xs text-light-muted dark:text-dark-muted mt-1">
                    Captain: <strong>{team.captainName}</strong> • Phone: {team.phone}
                    {team.contactEmail ? ` • ${team.contactEmail}` : ''}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {team.status !== 'CONFIRMED' && (
                    <button
                      type="button"
                      disabled={busyId === team.id}
                      onClick={() => handleStatusUpdate(team, { status: 'CONFIRMED' }, `Approved "${team.teamName}"!`)}
                      className="px-3 py-1.5 rounded-md bg-success text-on-success font-label text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <FontAwesomeIcon icon={faCheck} />
                      <span>Approve Team</span>
                    </button>
                  )}
                  {team.status !== 'REJECTED' && (
                    <button
                      type="button"
                      disabled={busyId === team.id}
                      onClick={() => handleStatusUpdate(team, { status: 'REJECTED' }, `Rejected "${team.teamName}".`)}
                      className="px-3 py-1.5 rounded-md border border-error text-error font-label text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <FontAwesomeIcon icon={faXmark} />
                      <span>Reject</span>
                    </button>
                  )}
                  {team.paymentStatus !== 'PAID' && team.paymentStatus !== 'FREE' && (
                    <button
                      type="button"
                      disabled={busyId === team.id}
                      onClick={() => handleStatusUpdate(team, { paymentStatus: 'PAID' }, `Marked "${team.teamName}" fee as PAID.`)}
                      className="px-3 py-1.5 rounded-md border border-primary text-primary font-label text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <FontAwesomeIcon icon={faMoneyBillWave} />
                      <span>Mark Fee Paid</span>
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busyId === team.id}
                    onClick={() => handleRemove(team)}
                    className="px-3 py-1.5 rounded-md border border-light-border dark:border-dark-border hover:border-error text-error font-label text-xs font-semibold flex items-center gap-1.5"
                  >
                    <FontAwesomeIcon icon={faTrashCan} />
                    <span>Remove</span>
                  </button>
                </div>
              </div>

              {Array.isArray(team.membersJson) && team.membersJson.length > 0 && (
                <div className="pt-3 border-t border-light-border dark:border-dark-border">
                  <span className="font-label text-xs uppercase text-light-muted dark:text-dark-muted font-semibold block mb-2">
                    Verified Squad Roster ({team.membersJson.length} Players)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {team.membersJson.map((m, idx) => (
                      <div
                        key={`${m.safetyId}-${idx}`}
                        className="p-2.5 rounded bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-semibold">{m.fullName}</p>
                          <p className="text-[11px] text-light-muted dark:text-dark-muted">
                            {m.role || 'Player'} {m.phoneNumber ? `• ${m.phoneNumber}` : ''}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-secondary/15 text-secondary font-mono text-[10px] font-bold flex items-center gap-1">
                          <FontAwesomeIcon icon={faShieldHalved} />
                          {m.safetyId}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventParticipantsPage;
