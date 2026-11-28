import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass,
  faFilter,
  faRotateRight,
  faMapLocationDot,
  faTableCellsLarge,
  faLocationCrosshairs,
} from '@fortawesome/free-solid-svg-icons';
import { matchService } from '../../services/endpoints/matchService';
import { useAuth } from '../../hooks/useAuth';
import { useAppStore } from '../../store/useAppStore';
import { haversineDistanceKm } from '../../utils/formatters';
import {
  isUserEligibleForMatch,
  formatMatchGenderLabel,
  formatMatchAgeLabel,
} from '../../utils/matchEligibility';
import { ROUTES } from '../../constants/routes';
import MapView from '../../components/common/MapView';
import Button from '../../components/common/Button';
import Pagination from '../../components/common/Pagination';
import toast from 'react-hot-toast';

export const ExploreMatchesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  // Filter states (applied client-side on cached Zustand matches without hitting DB)
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedSport, setSelectedSport] = useState('All Sports');
  const [selectedLocation, setSelectedLocation] = useState('All Bangladesh');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('Any Level');
  const [selectedAvailability, setSelectedAvailability] = useState('Open Slots Only');
  const [selectedSort, setSelectedSort] = useState('Nearest');

  // View mode: 'grid' or 'map'
  const [viewMode, setViewMode] = useState('grid');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const activeFiltersCount = [
    selectedSport !== 'All Sports',
    selectedLocation !== 'All Bangladesh',
    Boolean(selectedDate),
    selectedSkill !== 'Any Level',
    selectedAvailability !== 'Open Slots Only',
  ].filter(Boolean).length;

  const { user } = useAuth();
  const storeMatches = useAppStore((s) => s.matches);
  const storeLoading = useAppStore((s) => s.matchesLoading);
  const fetchStoreMatches = useAppStore((s) => s.fetchMatches);
  const sportsCatalog = useAppStore((s) => s.sports);
  const fetchSports = useAppStore((s) => s.fetchSports);
  const zonesCatalog = useAppStore((s) => s.zones);
  const fetchLocations = useAppStore((s) => s.fetchLocations);
  const userLocation = useAppStore((s) => s.userLocation);
  const detectUserLocation = useAppStore((s) => s.detectUserLocation);

  // Server-side Pagination for Grid mode (prevents loading large match datasets at once)
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMatchesCount, setTotalMatchesCount] = useState(0);
  const [gridMatches, setGridMatches] = useState([]);
  const [gridLoading, setGridLoading] = useState(true);
  const itemsPerPage = 8;

  // Sync search input when navigated from DashboardLayout top search bar
  useEffect(() => {
    const paramQ = searchParams.get('search') || '';
    if (paramQ !== searchQuery) {
      setSearchQuery(paramQ);
    }
  }, [searchParams]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedSport, selectedLocation, selectedDate, selectedSkill, selectedAvailability, searchQuery]);

  // Fetch sports, locations & GPS once on mount
  useEffect(() => {
    fetchSports();
    fetchLocations();
    detectUserLocation();
  }, [fetchSports, fetchLocations, detectUserLocation]);

  const loadPagedMatches = async (targetPage = page) => {
    setGridLoading(true);
    try {
      const matchedSportObj = (sportsCatalog || []).find(
        (s) => s.name?.toLowerCase() === selectedSport?.toLowerCase()
      );
      const res = await matchService.getMatches({
        page: targetPage - 1,
        size: itemsPerPage,
        status: 'ACTIVE',
        ...(matchedSportObj ? { sportId: matchedSportObj.id } : {}),
        ...(selectedSport !== 'All Sports' && !matchedSportObj ? { sport: selectedSport } : {}),
        ...(selectedLocation !== 'All Bangladesh' ? { location: selectedLocation, city: selectedLocation } : {}),
        ...(selectedSkill !== 'Any Level' ? { skillLevel: selectedSkill } : {}),
        ...(selectedDate ? { date: selectedDate } : {}),
        ...(selectedAvailability ? { availability: selectedAvailability } : {}),
        ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
      });
      setGridMatches(res.data || []);
      setTotalPages(res.totalPages || 1);
      setTotalMatchesCount(res.total ?? (res.data?.length || 0));
    } catch {
      toast.error('Failed to load matches.');
    } finally {
      setGridLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'grid') {
      loadPagedMatches(page);
    } else {
      fetchStoreMatches({ force: false });
    }
  }, [
    viewMode,
    page,
    selectedSport,
    selectedLocation,
    selectedDate,
    selectedSkill,
    selectedAvailability,
    searchQuery,
    user?.id,
    user?.gender,
    user?.age,
  ]);

  const loading = viewMode === 'map' ? storeLoading : gridLoading;
  const fetchMatches = async ({ force = false } = {}) => {
    if (viewMode === 'map') {
      return fetchStoreMatches({ force });
    }
    return loadPagedMatches(page);
  };

  const matches = useMemo(() => {
    const sourceList = viewMode === 'map' ? storeMatches || [] : gridMatches || [];
    const enriched = sourceList
      .filter(
        (m) =>
          m.state !== 'cancelled' &&
          m.status !== 'CANCELLED' &&
          isUserEligibleForMatch(user, m).eligible
      )
      .map((m) => {
        const dist =
          userLocation?.lat && userLocation?.lng
            ? haversineDistanceKm(
                userLocation.lat,
                userLocation.lng,
                m.coordinates?.lat,
                m.coordinates?.lng
              )
            : null;
        return { ...m, distanceKm: dist };
      });

    const sorted = [...enriched];
    if (selectedSort === 'Nearest') {
      sorted.sort((a, b) => {
        if (a.distanceKm !== null && b.distanceKm !== null) {
          return a.distanceKm - b.distanceKm;
        }
        return (a.area || '').localeCompare(b.area || '');
      });
    } else if (selectedSort === 'Most Slots') {
      sorted.sort((a, b) => (b.totalSlots - b.filledSlots) - (a.totalSlots - a.filledSlots));
    } else if (selectedSort === 'Newest') {
      sorted.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } else {
      sorted.sort((a, b) => (a.startTime || 0) - (b.startTime || 0));
    }

    return sorted;
  }, [viewMode, storeMatches, gridMatches, userLocation, selectedSort, user]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedSport('All Sports');
    setSelectedLocation('All Bangladesh');
    setSelectedDate('');
    setSelectedSkill('Any Level');
    setSelectedAvailability('Open Slots Only');
    setSelectedSort('Nearest');
    setSearchParams({});
    toast.success('Filters reset to default');
  };

  const handleJoinMatch = async (match) => {
    try {
      const res = await matchService.joinMatch(match.id, {
        mode: match.mode,
        isApprovalRequired: match.joinMode === 'Approval Required',
      });
      toast.success(res.message || 'Slot confirmed');
    } catch (err) {
      toast.error(err?.message || 'Failed to complete match action');
    }
  };

  const paginatedMatches = matches;

  return (
    <div className="flex flex-col gap-6">
      {/* Page Title & View Switcher Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="font-headline text-2xl sm:text-headline-lg font-bold text-light-on-background dark:text-dark-on-background tracking-tight">
            Explore Matches
          </h1>
          <p className="font-body text-xs sm:text-body-md text-light-muted dark:text-dark-muted mt-1 tabular-nums">
            Showing {viewMode === 'grid' ? `${matches.length} of ${totalMatchesCount}` : matches.length} eligible active match{(viewMode === 'grid' ? totalMatchesCount : matches.length) === 1 ? '' : 'es'}
            {userLocation ? ' • Sorted nearest your location first' : ''}
          </p>
          {user && (!user.age || !user.gender) && (
            <p className="font-body text-xs text-warning mt-1">
              Update your <strong>Age</strong> &amp; <strong>Gender</strong> in{' '}
              <Link to={ROUTES.PLAYER_PROFILE_EDIT} className="underline font-semibold">
                My Profile
              </Link>{' '}
              to see Boys/Girls Only &amp; age-restricted matches.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={async () => {
              const loc = await detectUserLocation({ force: true });
              if (loc) {
                setSelectedSort('Nearest');
                toast.success('Location updated — showing nearest matches first');
              } else {
                toast.error('Unable to access browser location');
              }
            }}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[38px] rounded-md bg-light-surface dark:bg-dark-surface text-light-on-surface dark:text-dark-on-surface border border-light-border dark:border-dark-border font-label text-xs font-semibold hover:border-primary transition-colors"
          >
            <FontAwesomeIcon icon={faLocationCrosshairs} className="text-primary" />
            <span>{userLocation ? 'Near Me' : 'Use Location'}</span>
          </button>

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
              <span>Map</span>
            </button>
          </div>

          {/* Sort Selector */}
          <label className="flex items-center gap-1.5 flex-1 sm:flex-initial min-w-[140px]">
            <span className="font-label text-xs text-light-muted dark:text-dark-muted hidden sm:inline">Sort:</span>
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 rounded-md bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-on-surface dark:text-dark-on-surface font-label text-xs sm:text-label-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Nearest">Nearest First</option>
              <option value="Earliest">Earliest</option>
              <option value="Newest">Newest</option>
              <option value="Most Slots">Most Slots</option>
            </select>
          </label>

          {/* Refresh from server */}
          <button
            type="button"
            onClick={() => fetchMatches({ force: true })}
            disabled={loading}
            aria-label="Sync matches"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-light-surface dark:bg-dark-surface text-light-on-surface dark:text-dark-on-surface border border-light-border dark:border-dark-border font-label text-xs sm:text-label-md hover:border-primary transition-colors disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faRotateRight} className={`text-xs text-primary ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden xs:inline sm:inline">Sync</span>
          </button>

          {/* Reset Filters */}
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-light-surface dark:bg-dark-surface text-light-on-surface dark:text-dark-on-surface border border-light-border dark:border-dark-border font-label text-xs sm:text-label-md hover:bg-light-surface-elevated dark:hover:bg-dark-surface-elevated transition-colors"
          >
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Instant Client-Side Search Bar + Collapsible Mobile Filters */}
      <section
        aria-label="Match discovery filters"
        className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-3.5 sm:p-4 flex flex-col gap-3 shadow-sm"
      >
        <div className="flex items-center gap-2">
          <div className="relative flex-1 flex items-center">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="absolute left-3.5 text-light-muted dark:text-dark-muted text-xs pointer-events-none"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search matches by title, venue, area, sport..."
              className="w-full pl-9 pr-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border text-light-on-background dark:text-dark-on-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowMobileFilters((prev) => !prev)}
            className={`lg:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-md border font-label text-xs font-semibold shrink-0 transition-colors ${
              showMobileFilters || activeFiltersCount > 0
                ? 'bg-primary/15 border-primary text-primary'
                : 'bg-light-background dark:bg-dark-background border-light-border dark:border-dark-border text-light-on-surface dark:text-dark-on-surface'
            }`}
          >
            <FontAwesomeIcon icon={faFilter} className="text-[11px]" />
            <span>Filters{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}</span>
          </button>
        </div>

        <div className={`${showMobileFilters ? 'grid' : 'hidden'} lg:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1 lg:pt-0`}>
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
            {sportsCatalog.length > 0 ? (
              sportsCatalog.map((sp) => (
                <option key={sp.id} value={sp.name}>
                  {sp.name}
                </option>
              ))
            ) : (
              <>
                <option value="Football">Football 7v7</option>
                <option value="Badminton">Badminton</option>
                <option value="Cricket">Cricket</option>
                <option value="Basketball">Basketball</option>
              </>
            )}
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
            {zonesCatalog.length > 0 ? (
              zonesCatalog.map((z) => (
                <option key={z.id} value={z.area}>
                  {z.area} ({z.city})
                </option>
              ))
            ) : (
              <>
                <option value="Dhaka">Dhaka</option>
                <option value="Chattogram">Chattogram</option>
                <option value="Sylhet">Sylhet</option>
                <option value="Rajshahi">Rajshahi</option>
                <option value="Khulna">Khulna</option>
              </>
            )}
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
        </div>
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
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2.5 py-1 rounded-full bg-light-surface-elevated dark:bg-dark-surface-elevated text-primary font-label text-label-sm font-semibold">
                            {match.sport}
                          </span>
                          {match.genderRestriction && match.genderRestriction !== 'ALL' && (
                            <span className="px-2 py-0.5 rounded-full bg-secondary/15 text-secondary font-label text-[11px] font-semibold">
                              {formatMatchGenderLabel(match.genderRestriction)}
                            </span>
                          )}
                          {(match.minAge > 0 || match.maxAge < 99) && (
                            <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary font-label text-[11px] font-semibold tabular-nums">
                              {formatMatchAgeLabel(match.minAge, match.maxAge)}
                            </span>
                          )}
                        </div>
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
                          {match.distanceKm !== null && match.distanceKm !== undefined ? ` • ${match.distanceKm} km away` : ''}
                        </p>
                      </div>
                    </div>

                    <footer className="pt-3 border-t border-light-border dark:border-dark-border flex items-center justify-between">
                      <span className="font-body text-body-sm text-light-muted dark:text-dark-muted">
                        Org: {match.organizer?.name || 'Organizer'}
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

          {/* Server-Side Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              className="pt-4"
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ExploreMatchesPage;
