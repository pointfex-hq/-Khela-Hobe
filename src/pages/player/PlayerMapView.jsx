import React, { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLocationCrosshairs, faShieldHalved } from '@fortawesome/free-solid-svg-icons';
import { matchService } from '../../services/endpoints/matchService';
import { useAppStore } from '../../store/useAppStore';
import MapView from '../../components/common/MapView';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';

export const PlayerMapView = () => {
  const matches = useAppStore((s) => s.matches);
  const fetchMatches = useAppStore((s) => s.fetchMatches);
  const detectUserLocation = useAppStore((s) => s.detectUserLocation);

  useEffect(() => {
    fetchMatches();
    detectUserLocation();
  }, [fetchMatches, detectUserLocation]);

  const handleSearchThisArea = async () => {
    await fetchMatches({ force: true });
    toast.success('Refreshed nearby matches.');
  };

  const handleJoinMatch = async (match) => {
    try {
      const res = await matchService.joinMatch(match.id);
      toast.success(res.message || 'Action completed');
    } catch (err) {
      toast.error(err?.message || 'Failed to reserve match slot');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Map Header (Reference lines 302-311 in UIUX/map_view/code.html) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-headline text-headline-md font-bold text-light-on-surface dark:text-dark-on-surface">
            Nearby Match Map
          </h1>
          <p className="font-body text-body-sm text-light-muted dark:text-dark-muted">
            Showing approximate venue zones in Dhaka &amp; Gazipur. Residential addresses are never shown.
          </p>
        </div>

        <Button
          variant="tertiary"
          size="md"
          icon={faLocationCrosshairs}
          onClick={(e) => {
            if (e) e.preventDefault();
            handleSearchThisArea();
          }}
          className="self-start sm:self-auto border-light-border dark:border-dark-border"
        >
          Search This Area
        </Button>
      </div>

      {/* Map Viewport and Selected Match Preview */}
      <MapView
        matches={matches}
        onJoinMatch={handleJoinMatch}
      />
    </div>
  );
};

export default PlayerMapView;
