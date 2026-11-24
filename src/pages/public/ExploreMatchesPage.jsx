import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass,
  faFilter,
  faRotateRight,
  faMapLocationDot,
  faTableCellsLarge,
  faClock,
  faUsers,
  faTrophy,
  faArrowRight,
  faFutbol,
  faTableTennisPaddleBall,
  faBasketball,
} from '@fortawesome/free-solid-svg-icons';
import { matchService } from '../../services/endpoints/matchService';
import { ROUTES } from '../../constants/routes';
import MapView from '../../components/common/MapView';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';

export const ExploreMatchesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  // Filter states
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedSport, setSelectedSport] = useState('All Sports');
  const [selectedLocation, setSelectedLocation] = useState('All Bangladesh');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('Any Level');
  const [selectedAvailability, setSelectedAvailability] = useState('Open Slots Only');
  const [selectedSort, setSelectedSort] = useState('Earliest');

  // View mode: 'grid' or 'map'
  const [viewMode, setViewMode] = useState('grid');

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      try {
        const res = await matchService.getMatches({
          search: searchQuery,
          sport: selectedSport,
          location: selectedLocation,
          date: selectedDate,
          skillLevel: selectedSkill,
          availability: selectedAvailability,
          sort: selectedSort,
        });
        setMatches(res.data || []);
      } catch (err) {
        console.error('Failed to query matches', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [
    searchQuery,
    selectedSport,
    selectedLocation,
    selectedDate,
    selectedSkill,
    selectedAvailability,
    selectedSort,
  ]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedSport('All Sports');
    setSelectedLocation('All Bangladesh');
    setSelectedDate('');
    setSelectedSkill('Any Level');
    setSelectedAvailability('Open Slots Only');
    setSelectedSort('Earliest');
    setSearchParams({});
    toast.success('Filters reset to default');
  };

  const handleJoinMatch = async (match) => {
    try {
      const res = await matchService.joinMatch(match.id);
      toast.success(res.message || 'Slot confirmed');
      // Refresh match list
      const refreshed = await matchService.getMatches({
        search: searchQuery,
        sport: selectedSport,
        location: selectedLocation,
        date: selectedDate,
        skillLevel: selectedSkill,
        availability: selectedAvailability,
        sort: selectedSort,
      });
      setMatches(refreshed.data || []);
    } catch {
      toast.error('Failed to complete match action');
    }
  };

  const getSportIcon = (sport = '') => {
    const s = sport.toLowerCase();
    if (s.includes('badminton')) return faTableTennisPaddleBall;
    if (s.includes('basketball')) return faBasketball;
    return faFutbol;
  };

  const paginatedMatches = useMemo(() => {
    return matches.slice(0, page * itemsPerPage);
  }, [matches, page]);

  return (
    <div className="flex flex-col gap-6">
      {/* Page Title & View Switcher Bar (Matches Reference lines 303-322) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-headline-lg font-bold text-light-on-background dark:text-dark-on-background tracking-tight">
            Explore Matches
          </h1>
          <p className="font-body text-body-md text-light-muted dark:text-dark-muted mt-1 tabular-nums">
            Showing {matches.length} active match{matches.length === 1 ? '' : 'es'} across Dhaka, Gazipur &amp; Chattogram
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Grid vs Map Toggle */}
          <div className="p-1 rounded-md bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label="Grid View"
              className={`px-3 py-1.5 rounded text-xs font-label font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-light-muted dark:text-dark-muted hover:text-light-on-surface dark:hover:text-dark-on-surface'
              }`}
            >
              <FontAwesomeIcon icon={faTableCellsLarge} className="text-xs" />
              <span>Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              aria-label="Map View"
              className={`px-3 py-1.5 rounded text-xs font-label font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'map'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-light-muted dark:text-dark-muted hover:text-light-on-surface dark:hover:text-dark-on-surface'
              }`}
            >
              <FontAwesomeIcon icon={faMapLocationDot} className="text-xs" />
              <span>Map View</span>
            </button>
          </div>

          {/* Sort Selector */}
          <label className="flex items-center gap-2">
            <span className="font-label text-label-md text-light-muted dark:text-dark-muted">Sort:</span>
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="px-3 py-2 rounded-md bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-on-surface dark:text-dark-on-surface font-label text-label-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Earliest">Earliest</option>
              <option value="Nearest">Nearest</option>
              <option value="Newest">Newest</option>
              <option value="Most Slots">Most Slots</option>
            </select>
          </label>

          {/* Reset Filters */}
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-light-surface dark:bg-dark-surface text-light-on-surface dark:text-dark-on-surface border border-light-border dark:border-dark-border font-label text-label-md hover:bg-light-surface-elevated dark:hover:bg-dark-surface-elevated transition-colors"
          >
            <FontAwesomeIcon icon={faRotateRight} className="text-xs text-primary" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Filter Bar (Reference lines 324-370) */}
      <section
        aria-label="Match discovery filters"
        className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 shadow-sm"
      >
        {/* Sport */}
        <label className="flex flex-col gap-1">
          <span className="font-label text-label-sm text-light-muted dark:text-dark-muted font-medium">
            Sport
          </span>
          <select
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border text-light-on-background dark:text-dark-on-background font-body text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="All Sports">All Sports</option>
            <option value="Football">Football 7v7</option>
            <option value="Badminton">Badminton</option>
            <option value="Cricket">Cricket</option>
            <option value="Basketball">Basketball</option>
          </select>
        </label>

        {/* Location */}
        <label className="flex flex-col gap-1">
          <span className="font-label text-label-sm text-light-muted dark:text-dark-muted font-medium">
            Location
          </span>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border text-light-on-background dark:text-dark-on-background font-body text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="All Bangladesh">All Bangladesh</option>
            <option value="Dhaka North">Dhaka North</option>
            <option value="Gazipur">Gazipur</option>
            <option value="Banani">Banani</option>
            <option value="Uttara">Uttara</option>
            <option value="Mirpur">Mirpur</option>
            <option value="Dhanmondi">Dhanmondi</option>
            <option value="Chattogram">Chattogram</option>
          </select>
        </label>

        {/* Date */}
        <label className="flex flex-col gap-1">
          <span className="font-label text-label-sm text-light-muted dark:text-dark-muted font-medium">
            Date
          </span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border text-light-on-background dark:text-dark-on-background font-body text-body-md tabular-nums focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </label>

        {/* Skill Level */}
        <label className="flex flex-col gap-1">
          <span className="font-label text-label-sm text-light-muted dark:text-dark-muted font-medium">
            Skill Level
          </span>
          <select
            value={selectedSkill}
            onChange={(e) => setSelectedSkill(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border text-light-on-background dark:text-dark-on-background font-body text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="Any Level">Any Level</option>
            <option value="Casual">Casual / All Levels</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Competitive">Competitive</option>
          </select>
        </label>

        {/* Availability */}
        <label className="flex flex-col gap-1">
          <span className="font-label text-label-sm text-light-muted dark:text-dark-muted font-medium">
            Availability
          </span>
          <select
            value={selectedAvailability}
            onChange={(e) => setSelectedAvailability(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border text-light-on-background dark:text-dark-on-background font-body text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="Open Slots Only">Open Slots Only</option>
            <option value="Include Full Matches">Include Full Matches</option>
          </select>
        </label>
      </section>

      {/* Main Content: Map or Grid View */}
      {viewMode === 'map' ? (
        <MapView
          matches={matches}
          onJoinMatch={handleJoinMatch}
        />
      ) : (
        /* Responsive Match Grid */
        <div className="flex flex-col gap-6">
          {matches.length === 0 ? (
            <div className="p-12 text-center rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border flex flex-col items-center gap-3">
              <FontAwesomeIcon icon={faFilter} className="text-3xl text-light-muted dark:text-dark-muted" />
              <h3 className="font-headline text-lg font-bold">No matches match your current filters</h3>
              <p className="font-body text-sm text-light-muted dark:text-dark-muted max-w-sm">
                Try widening your search radius, selecting all sports, or clearing date parameters.
              </p>
              <Button variant="primary" size="sm" onClick={handleResetFilters}>
                Clear All Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              {paginatedMatches.map((match) => {
                const slotsLeft = match.totalSlots - match.filledSlots;
                const isFull = slotsLeft <= 0 || match.joinMode === 'Match Full';

                return (
                  <article
                    key={match.id}
                    className="h-full rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-5 flex flex-col justify-between gap-4 hover:border-primary transition-colors duration-state-change shadow-sm"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-1 rounded-full bg-light-surface-elevated dark:bg-dark-surface-elevated text-primary font-label text-label-sm font-semibold">
                          {match.sport}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-label text-label-sm font-bold ${
                            isFull
                              ? 'bg-error text-on-error'
                              : match.joinMode === 'Approval Required'
                              ? 'bg-warning text-on-warning'
                              : 'bg-success text-on-success'
                          }`}
                        >
                          {isFull ? 'Match Full' : match.joinMode}
                        </span>
                      </div>

                      <div>
                        <Link to={`/matches/${match.id}`}>
                          <h2 className="font-headline text-title-lg font-bold text-light-on-surface dark:text-dark-on-surface hover:text-primary transition-colors">
                            {match.title}
                          </h2>
                        </Link>
                        <p className="font-body text-body-sm text-light-muted dark:text-dark-muted mt-1 tabular-nums">
                          {match.venue} • {match.schedule} • {match.filledSlots} / {match.totalSlots} players • {match.skillLevel}
                        </p>
                      </div>
                    </div>

                    <footer className="pt-3 border-t border-light-border dark:border-dark-border flex items-center justify-between">
                      <span className="font-body text-body-sm text-light-muted dark:text-dark-muted">
                        Org: {match.organizer?.name || 'Rafiqul Islam'}
                      </span>

                      {isFull ? (
                        <Link to={`/matches/${match.id}`}>
                          <Button variant="tertiary" size="sm">
                            View Details
                          </Button>
                        </Link>
                      ) : match.joinMode === 'Approval Required' ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleJoinMatch(match)}
                        >
                          Apply
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleJoinMatch(match)}
                        >
                          Join Match
                        </Button>
                      )}
                    </footer>
                  </article>
                );
              })}
            </div>
          )}

          {/* Load More Pagination */}
          {matches.length > paginatedMatches.length && (
            <div className="flex justify-center pt-4">
              <Button
                variant="tertiary"
                size="md"
                onClick={() => setPage((p) => p + 1)}
              >
                Load More Matches ({matches.length - paginatedMatches.length} remaining)
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExploreMatchesPage;
