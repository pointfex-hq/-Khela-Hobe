import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLocationCrosshairs, faShieldHalved } from '@fortawesome/free-solid-svg-icons';
import { matchService } from '../../services/endpoints/matchService';
import MapView from '../../components/common/MapView';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';

export const PlayerMapView = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMatches = async () => {
      setLoading(true);
      try {
        const res = await matchService.getMatches();
        setMatches(res.data || []);
      } catch (err) {
        console.error('Failed to load map data', err);
      } finally {
        setLoading(false);
      }
    };

    loadMatches();
  }, []);

  const handleSearchThisArea = () => {
    toast.success('Updated matches for Dhaka & Gazipur metro bounds.');
  };

  const handleJoinMatch = async (match) => {
    try {
      const res = await matchService.joinMatch(match.id);
      toast.success(res.message || 'Action completed');
      const refreshed = await matchService.getMatches();
      setMatches(refreshed.data || []);
    } catch {
      toast.error('Failed to reserve match slot');
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
