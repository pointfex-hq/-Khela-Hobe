import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFutbol,
  faPlus,
  faMinus,
  faLocationDot,
  faLocationCrosshairs,
  faArrowRight,
  faUsers,
  faClock,
  faTrophy,
  faMap,
  faCompass,
  faMagnifyingGlass,
  faXmark,
  faLayerGroup,
  faSliders,
  faShieldHalved,
  faCheck,
  faExpand,
  faCompress,
} from '@fortawesome/free-solid-svg-icons';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ROUTES } from '../../constants/routes';
import Button from './Button';
import { useTheme } from '../../hooks/useTheme';
import { useAppStore } from '../../store/useAppStore';
import { haversineDistanceKm } from '../../utils/formatters';

function getSportEmoji(match) {
  const icon = match?.sportDto?.iconUrl;
  if (icon && !/^https?:\/\//i.test(icon)) {
    return icon;
  }
  const s = String(match?.sport || match?.sportCategory || '').toLowerCase();
  if (s.includes('basketball')) return '🏀';
  if (s.includes('badminton')) return '🏸';
  if (s.includes('cricket')) return '🏏';
  if (s.includes('tennis') || s.includes('ping')) return '🏓';
  if (s.includes('volleyball')) return '🏐';
  return '⚽';
}

function getSportMarkerIconHtml(match) {
  const icon = match?.sportDto?.iconUrl;
  if (icon && /^https?:\/\//i.test(icon)) {
    const escaped = icon.replace(/"/g, '&quot;');
    return `<img src="${escaped}" alt="" style="width:16px;height:16px;border-radius:9999px;object-fit:cover;" />`;
  }
  return `<span style="font-size:14px;line-height:1;">${getSportEmoji(match)}</span>`;
}

/**
 * Standard Dhaka Metro Zones with Exact GPS Coordinates
 */
export const DHAKA_ZONES = [
  { id: 'all', label: 'Full Dhaka City', sublabel: 'Metro Area (Default)', lat: 23.8103, lng: 90.4125, zoom: 11.5, customX: 380, customY: 260 },
  { id: 'banani', label: 'Banani & Gulshan', sublabel: 'North Dhaka', lat: 23.7937, lng: 90.4066, zoom: 14, customX: 420, customY: 260 },
  { id: 'uttara', label: 'Uttara', sublabel: 'Sector 4, 11 & Diabari', lat: 23.8759, lng: 90.3795, zoom: 14, customX: 310, customY: 190 },
  { id: 'dhanmondi', label: 'Dhanmondi', sublabel: 'Abahani & Satmasjid', lat: 23.7461, lng: 90.3742, zoom: 14, customX: 340, customY: 350 },
  { id: 'mirpur', label: 'Mirpur', sublabel: 'Mirpur 1, 2, 10 & DOHS', lat: 23.8067, lng: 90.3687, zoom: 14, customX: 260, customY: 390 },
  { id: 'bashundhara', label: 'Bashundhara R/A', sublabel: 'Block A to I & 300 Feet', lat: 23.8164, lng: 90.4326, zoom: 14, customX: 490, customY: 220 },
  { id: 'mohammadpur', label: 'Mohammadpur', sublabel: 'Town Hall & Ring Road', lat: 23.7658, lng: 90.3584, zoom: 14, customX: 280, customY: 330 },
  { id: 'badda', label: 'Badda & Rampura', sublabel: 'Gulshan Link & Hatirjheel', lat: 23.7744, lng: 90.4262, zoom: 14, customX: 440, customY: 290 },
  { id: 'gazipur', label: 'Gazipur Sadar', sublabel: 'North Greater Metro', lat: 23.9999, lng: 90.4203, zoom: 13, customX: 220, customY: 110 },
  { id: 'old_dhaka', label: 'Old Dhaka & Motijheel', sublabel: 'South Metro', lat: 23.7231, lng: 90.4175, zoom: 14, customX: 380, customY: 460 },
];

/**
 * Reusable Interactive Map View Component
 * Supports both "Original Map" (Real OpenStreetMap Leaflet Engine)
 * and "Custom Map" (Athletic Night-Turf Radar Canvas).
 */
export const MapView = ({
  matches = [],
  selectedMatchId,
  onSelectMatch,
  onJoinMatch,
  className = '',
}) => {
  const { isDark } = useTheme();

  // Mode: 'original' (Real Street Map) vs 'custom' (Athletic Turf Radar)
  const [mapMode, setMapMode] = useState('original');
  const [selectedZoneId, setSelectedZoneId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedArea, setSearchedArea] = useState(null);
  const [customZoom, setCustomZoom] = useState(1);
  const storeUserLocation = useAppStore((s) => s.userLocation);
  const detectUserLocation = useAppStore((s) => s.detectUserLocation);
  const storeZones = useAppStore((s) => s.zones);
  const storeVenues = useAppStore((s) => s.venues);
  const fetchLocations = useAppStore((s) => s.fetchLocations);
  const [userLocation, setUserLocation] = useState(storeUserLocation);
  const [isLocating, setIsLocating] = useState(false);
  const [searchingArea, setSearchingArea] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    if (!isFullScreen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (ev) => {
      if (ev.key === 'Escape') setIsFullScreen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isFullScreen]);

  useEffect(() => {
    if (mapMode === 'original' && leafletMapInstanceRef.current) {
      const t = setTimeout(() => {
        leafletMapInstanceRef.current?.invalidateSize();
      }, 160);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [isFullScreen, mapMode]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  useEffect(() => {
    if (storeUserLocation) {
      setUserLocation(storeUserLocation);
    }
  }, [storeUserLocation]);

  const dynamicZones = useMemo(() => {
    if (Array.isArray(storeZones) && storeZones.length > 0) {
      return [
        { id: 'all', label: 'All Bangladesh', sublabel: 'Nationwide View', lat: 23.8103, lng: 90.4125, zoom: 7, customX: 380, customY: 260 },
        ...storeZones.map((z) => ({
          id: z.id,
          label: z.area,
          sublabel: `${z.city}, ${z.division}`,
          city: z.city,
          division: z.division,
          lat: z.latitude,
          lng: z.longitude,
          zoom: z.zoom || 14,
          customX: 380,
          customY: 260,
        })),
      ];
    }
    return DHAKA_ZONES;
  }, [storeZones]);

  const [currentSelectedId, setCurrentSelectedId] = useState(
    selectedMatchId || (matches[0] ? matches[0].id : null)
  );

  const leafletContainerRef = useRef(null);
  const leafletMapInstanceRef = useRef(null);
  const markersLayerGroupRef = useRef(null);
  const tileLayerRef = useRef(null);

  // Selected zone definition
  const currentZone = useMemo(() => {
    return dynamicZones.find((z) => z.id === selectedZoneId) || dynamicZones[0];
  }, [selectedZoneId, dynamicZones]);

  // Filter and sort matches (nearest to searched area or user location first)
  const filteredMatches = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const filtered = matches.filter((m) => {
      // If user searched an area via Find Area / coordinates, include matches within 20km OR matching text
      if (searchedArea?.lat && searchedArea?.lng) {
        const distToArea = haversineDistanceKm(
          searchedArea.lat,
          searchedArea.lng,
          m.coordinates?.lat,
          m.coordinates?.lng
        );
        const matchesText =
          !q ||
          m.title?.toLowerCase().includes(q) ||
          m.venue?.toLowerCase().includes(q) ||
          m.area?.toLowerCase().includes(q) ||
          m.city?.toLowerCase().includes(q) ||
          m.sport?.toLowerCase().includes(q);
        return matchesText || (distToArea !== null && distToArea <= 20);
      }

      // Zone filter: if not 'all', match by area, city, or proximity within 10km of zone center
      const distToZone =
        selectedZoneId !== 'all' && currentZone?.lat && currentZone?.lng
          ? haversineDistanceKm(currentZone.lat, currentZone.lng, m.coordinates?.lat, m.coordinates?.lng)
          : null;
      const matchesZone =
        selectedZoneId === 'all' ||
        (m.area && m.area.toLowerCase().includes(currentZone.label.toLowerCase().split(' ')[0])) ||
        (m.city && currentZone.city && m.city.toLowerCase().includes(currentZone.city.toLowerCase())) ||
        (distToZone !== null && distToZone <= 10);

      if (!q) return matchesZone;
      const matchesQuery =
        (m.title && m.title.toLowerCase().includes(q)) ||
        (m.venue && m.venue.toLowerCase().includes(q)) ||
        (m.area && m.area.toLowerCase().includes(q)) ||
        (m.city && m.city.toLowerCase().includes(q)) ||
        (m.sport && m.sport.toLowerCase().includes(q));

      return matchesZone && matchesQuery;
    });

    const anchorLat = searchedArea?.lat ?? (selectedZoneId !== 'all' ? currentZone?.lat : userLocation?.lat);
    const anchorLng = searchedArea?.lng ?? (selectedZoneId !== 'all' ? currentZone?.lng : userLocation?.lng);
    if (anchorLat && anchorLng) {
      return [...filtered]
        .map((m) => ({
          ...m,
          _areaDistKm: haversineDistanceKm(anchorLat, anchorLng, m.coordinates?.lat, m.coordinates?.lng),
        }))
        .sort((a, b) => (a._areaDistKm ?? 9999) - (b._areaDistKm ?? 9999));
    }
    return filtered;
  }, [matches, selectedZoneId, currentZone, searchQuery, searchedArea, userLocation]);

  const selectedMatch = useMemo(() => {
    return (
      filteredMatches.find((m) => m.id === currentSelectedId) ||
      matches.find((m) => m.id === currentSelectedId) ||
      filteredMatches[0] ||
      matches[0] ||
      null
    );
  }, [filteredMatches, matches, currentSelectedId]);

  const handleSelectMatch = (match, e) => {
    if (e) e.preventDefault();
    setCurrentSelectedId(match.id);
    if (onSelectMatch) onSelectMatch(match);

    // Pan original map if loaded
    if (mapMode === 'original' && leafletMapInstanceRef.current && match.coordinates?.lat && match.coordinates?.lng) {
      leafletMapInstanceRef.current.panTo([match.coordinates.lat, match.coordinates.lng], {
        animate: true,
        duration: 0.8,
      });
    }
  };

  // Switch Zone / Area
  const handleZoneSelect = (zoneId, e) => {
    if (e) e.preventDefault();
    setSearchedArea(null);
    setSelectedZoneId(zoneId);
    const targetZone = dynamicZones.find((z) => z.id === zoneId) || dynamicZones[0];

    // Fly to zone on Original Map
    if (mapMode === 'original' && leafletMapInstanceRef.current && targetZone) {
      leafletMapInstanceRef.current.flyTo([targetZone.lat, targetZone.lng], targetZone.zoom || 13, {
        duration: 1.2,
      });
    }
  };

  // Search area directly on the Leaflet street map (Zones -> Venues -> Nominatim Bangladesh geocode)
  const handleSearchAreaOnMap = async (e) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (!q) {
      setSearchedArea(null);
      return;
    }

    const qLower = q.toLowerCase();
    const matchedZone = dynamicZones.find(
      (z) =>
        z.id !== 'all' &&
        (z.label?.toLowerCase().includes(qLower) ||
          z.city?.toLowerCase().includes(qLower) ||
          z.division?.toLowerCase().includes(qLower))
    );
    if (matchedZone) {
      setSelectedZoneId('all');
      setSearchedArea({ lat: matchedZone.lat, lng: matchedZone.lng, label: matchedZone.label });
      if (mapMode === 'original' && leafletMapInstanceRef.current) {
        leafletMapInstanceRef.current.flyTo([matchedZone.lat, matchedZone.lng], matchedZone.zoom || 14, {
          duration: 1.1,
        });
      }
      return;
    }

    const matchedVenue = storeVenues.find(
      (v) =>
        v.name?.toLowerCase().includes(qLower) ||
        v.area?.toLowerCase().includes(qLower) ||
        v.city?.toLowerCase().includes(qLower)
    );
    if (matchedVenue) {
      setSelectedZoneId('all');
      setSearchedArea({
        lat: matchedVenue.latitude,
        lng: matchedVenue.longitude,
        label: matchedVenue.area || matchedVenue.name,
      });
      if (mapMode === 'original' && leafletMapInstanceRef.current) {
        leafletMapInstanceRef.current.flyTo([matchedVenue.latitude, matchedVenue.longitude], 15, {
          duration: 1.1,
        });
      }
      return;
    }

    setSearchingArea(true);
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=bd&q=${encodeURIComponent(q)}`
      );
      const data = await resp.json();
      if (Array.isArray(data) && data[0]) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
          setSelectedZoneId('all');
          setSearchedArea({ lat, lng: lon, label: q });
          if (mapMode === 'original' && leafletMapInstanceRef.current) {
            leafletMapInstanceRef.current.flyTo([lat, lon], 14, { duration: 1.2 });
          }
        }
      }
    } catch {
      // Keep local text filter active if offline
    } finally {
      setSearchingArea(false);
    }
  };

  // Focus / Reset map camera to the currently selected zone
  const handleFocusSelectedZone = (e) => {
    if (e) e.preventDefault();
    setSearchedArea(null);
    if (mapMode === 'original' && leafletMapInstanceRef.current && currentZone) {
      leafletMapInstanceRef.current.flyTo(
        [currentZone.lat, currentZone.lng],
        currentZone.zoom || 13,
        { duration: 1.0 }
      );
    } else {
      setCustomZoom(1);
    }
  };

  // User Geolocation Finder
  const handleLocateMe = async (e) => {
    if (e) e.preventDefault();
    setIsLocating(true);
    const coords = await detectUserLocation({ force: true });
    setIsLocating(false);
    if (coords) {
      setUserLocation(coords);
      if (mapMode === 'original' && leafletMapInstanceRef.current) {
        leafletMapInstanceRef.current.flyTo([coords.lat, coords.lng], 14, { duration: 1.2 });
      }
    } else if (mapMode === 'original' && leafletMapInstanceRef.current) {
      leafletMapInstanceRef.current.flyTo([23.8103, 90.4125], 12, { duration: 1.0 });
    }
  };

  // Initialize and maintain Leaflet Original Map instance
  useEffect(() => {
    if (mapMode !== 'original' || !leafletContainerRef.current) return;

    if (!leafletMapInstanceRef.current) {
      // Create Leaflet Map Instance
      const map = L.map(leafletContainerRef.current, {
        center: [currentZone.lat, currentZone.lng],
        zoom: currentZone.zoom,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: true,
      });

      leafletMapInstanceRef.current = map;
      markersLayerGroupRef.current = L.layerGroup().addTo(map);
    }

    const map = leafletMapInstanceRef.current;

    // Remove existing tile layer if theme changed
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    // High quality street map tiles: Dark Matter for dark mode, Voyager/Positron for light mode
    const cartoApiKey = (import.meta.env.VITE_CARTO_BASEMAP_API_KEY || '').trim();
    const baseCartoUrl = isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    const tileUrl = cartoApiKey
      ? `${baseCartoUrl}?key=${encodeURIComponent(cartoApiKey)}`
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const tiles = L.tileLayer(tileUrl, {
      subdomains: cartoApiKey ? 'abcd' : 'abc',
      maxZoom: 19,
    }).addTo(map);
    tileLayerRef.current = tiles;

    // Timeout trigger to recalculate size inside flex containers
    const resizeTimer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(resizeTimer);
    };
  }, [mapMode, isDark]);

  // Update Leaflet markers when matches, filter, or selection changes
  useEffect(() => {
    if (mapMode !== 'original' || !leafletMapInstanceRef.current || !markersLayerGroupRef.current) return;

    const layerGroup = markersLayerGroupRef.current;
    layerGroup.clearLayers();

    // Render User Location Pin if available
    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'user-pin-wrapper',
        html: `
          <div style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:9999px;background:#32C77A;border:3px solid #FFFFFF;box-shadow:0 0 12px rgba(50,199,122,0.8);">
            <div style="width:8px;height:8px;border-radius:9999px;background:#002110;"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon, title: 'Your Location' })
        .addTo(layerGroup)
        .bindPopup('<strong style="font-family:Inter,sans-serif;">You are here</strong>');
    }

    // Render Match Pins (Sport icon + remaining slot number only)
    filteredMatches.forEach((match) => {
      const lat = match.coordinates?.lat || 23.8103;
      const lng = match.coordinates?.lng || 90.4125;
      const isSelected = match.id === currentSelectedId;
      const slotsLeft = Math.max(0, (match.totalSlots || 0) - (match.filledSlots || 0));
      const sportIconHtml = getSportMarkerIconHtml(match);

      const customHtml = `
        <div style="
          transform: translate(-50%, -50%);
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: ${isSelected ? '5px 11px' : '4px 9px'};
          border-radius: 9999px;
          background-color: ${isSelected ? '#B9F34A' : isDark ? '#1B2923' : '#FFFFFF'};
          color: ${isSelected ? '#131F00' : isDark ? '#FFFFFF' : '#101A17'};
          border: ${isSelected ? '2px solid #FFFFFF' : '1.5px solid #B9F34A'};
          box-shadow: 0 4px 14px rgba(0,0,0,0.35);
          font-family: Inter, sans-serif;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          white-space: nowrap;
          transition: transform 120ms ease;
        ">
          ${sportIconHtml}
          <span style="font-variant-numeric: tabular-nums;">${slotsLeft}</span>
        </div>
      `;

      const matchIcon = L.divIcon({
        className: 'match-marker-wrapper',
        html: customHtml,
        iconSize: [0, 0],
      });

      const marker = L.marker([lat, lng], { icon: matchIcon }).addTo(layerGroup);

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        handleSelectMatch(match);
      });
    });
  }, [mapMode, filteredMatches, currentSelectedId, userLocation, isDark]);

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* ========================================================================= */}
      {/* TOP CONTROLS: Mode Switcher, Zone Selector, Search Bar & Locate */}
      {/* ========================================================================= */}
      <div className="rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-3 sm:p-4 flex flex-col gap-3 shadow-sm">
        {/* Top Row: Mode Switcher & Zone Selector */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Map Engine Mode Switcher: Original Map vs Custom Map */}
          <div className="inline-flex items-center p-1 rounded-lg bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border self-start">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setMapMode('original');
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-label font-semibold flex items-center gap-2 transition-all ${
                mapMode === 'original'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-light-muted dark:text-dark-muted hover:text-light-on-background dark:hover:text-dark-on-background'
              }`}
            >
              <FontAwesomeIcon icon={faMap} className="text-xs" />
              <span>Original Map (Street View)</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setMapMode('custom');
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-label font-semibold flex items-center gap-2 transition-all ${
                mapMode === 'custom'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-light-muted dark:text-dark-muted hover:text-light-on-background dark:hover:text-dark-on-background'
              }`}
            >
              <FontAwesomeIcon icon={faCompass} className="text-xs" />
              <span>Custom Map (Turf Radar)</span>
            </button>
          </div>

          {/* Area / Zone Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="font-label text-xs font-semibold text-light-muted dark:text-dark-muted shrink-0 hidden sm:inline">
              Selected Zone:
            </span>
            <select
              value={selectedZoneId}
              onChange={(e) => handleZoneSelect(e.target.value, e)}
              className="flex-1 sm:flex-initial min-w-0 px-3 py-1.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border text-light-on-background dark:text-dark-on-background font-body text-xs focus:outline-none focus:ring-2 focus:ring-primary font-medium"
            >
              {dynamicZones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.label} ({zone.sublabel})
                </option>
              ))}
            </select>

            {/* Focus on Selected Zone Button (beside Selected Zone dropdown) */}
            <button
              type="button"
              onClick={handleFocusSelectedZone}
              title={`Center map on ${currentZone?.label || 'selected zone'}`}
              aria-label="Center map on selected zone"
              className="w-8 h-8 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border hover:border-primary flex items-center justify-center text-primary transition-colors shrink-0"
            >
              <FontAwesomeIcon icon={faLocationDot} className="text-xs" />
            </button>
          </div>
        </div>

        {/* Second Row: Live Search Area & Matches within Map */}
        <form onSubmit={handleSearchAreaOnMap} className="flex gap-2">
          <div className="relative flex-1 flex items-center">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="absolute left-3.5 text-light-muted dark:text-dark-muted text-xs pointer-events-none"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value;
                setSearchQuery(val);
                if (!val.trim()) setSearchedArea(null);
              }}
              placeholder="Search any area in Bangladesh (e.g., Dhanmondi, Sylhet, Chattogram, Bogura) or sport..."
              className="w-full pl-9 pr-9 py-2 rounded-lg bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-xs sm:text-sm text-light-on-background dark:text-dark-on-background placeholder:text-light-muted dark:placeholder:text-dark-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setSearchQuery('');
                  setSearchedArea(null);
                }}
                aria-label="Clear search"
                className="absolute right-3 text-light-muted hover:text-light-on-background dark:hover:text-dark-on-background text-xs"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={searchingArea}
            className="px-3.5 py-2 rounded-lg bg-primary text-on-primary font-label text-xs font-semibold hover:opacity-90 disabled:opacity-50 shrink-0"
          >
            {searchingArea ? 'Locating...' : 'Find Area'}
          </button>
        </form>

        {/* Quick Zone Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {dynamicZones.slice(0, 14).map((zone) => {
            const isSelected = selectedZoneId === zone.id;
            return (
              <button
                key={zone.id}
                type="button"
                onClick={(e) => handleZoneSelect(zone.id, e)}
                className={`shrink-0 px-2.5 py-1 rounded-full font-label text-[11px] font-semibold transition-all ${
                  isSelected
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted hover:text-light-on-surface dark:hover:text-dark-on-surface'
                }`}
              >
                {zone.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FULL-WIDTH INTERACTIVE MAP CARD                                         */}
      {/* ========================================================================= */}
      <section
        aria-label="Interactive Match Map Viewport"
        className={
          isFullScreen
            ? 'fixed inset-0 z-50 w-screen h-[100dvh] bg-light-surface dark:bg-dark-surface overflow-hidden'
            : 'relative w-full h-[400px] sm:h-[500px] lg:h-[560px] rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface overflow-hidden shadow-sm'
        }
      >
          {/* Mode A: Original Street Map (Leaflet OpenStreetMap / CartoDB) */}
          <div
            ref={leafletContainerRef}
            className={`absolute inset-0 w-full h-full ${mapMode === 'original' ? 'block' : 'hidden'}`}
            style={{ zIndex: 1 }}
          />

          {/* Mode B: Custom Athletic Turf Radar Map Canvas */}
          {mapMode === 'custom' && (
            <div
              className="absolute inset-0 w-full h-full transition-transform duration-300"
              style={{ transform: `scale(${customZoom})`, transformOrigin: 'center center' }}
            >
              {/* Subtle Grid & Arterial Roadways */}
              <svg
                className="absolute inset-0 w-full h-full opacity-20 text-light-on-background dark:text-dark-on-background pointer-events-none"
                viewBox="0 0 800 600"
                fill="none"
                aria-hidden="true"
              >
                {/* Grid Matrix */}
                <path d="M0 120H800M0 240H800M0 360H800M0 480H800" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
                <path d="M160 0V600M320 0V600M480 0V600M640 0V600" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />

                {/* Dhaka Highways & Arterial Curves */}
                <path d="M90 580 C220 440, 310 320, 420 220 C510 140, 620 90, 740 40" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                <path d="M40 300 C210 270, 380 320, 560 400 C650 440, 720 480, 780 540" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                <path d="M300 80 C310 180, 330 300, 350 580" stroke="currentColor" strokeWidth="3" />
                <path d="M480 180 C400 280, 280 400, 200 560" stroke="currentColor" strokeWidth="2" strokeDasharray="6 3" />
              </svg>

              {/* Regional Metro Zone Labels */}
              {DHAKA_ZONES.filter((z) => z.id !== 'all').map((zone) => (
                <span
                  key={zone.id}
                  style={{ left: `${zone.customX}px`, top: `${zone.customY}px` }}
                  className="absolute font-label text-xs sm:text-sm font-semibold tracking-wide text-light-muted/80 dark:text-dark-muted/80 select-none pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
                >
                  {zone.label}
                </span>
              ))}

              {/* Custom Map Match Markers (Sport icon + remaining slot number only) */}
              {filteredMatches.map((match) => {
                const isSelected = match.id === currentSelectedId;
                const x = match.coordinates?.x || 380;
                const y = match.coordinates?.y || 260;
                const slotsLeft = Math.max(0, (match.totalSlots || 0) - (match.filledSlots || 0));
                const iconUrl = match?.sportDto?.iconUrl;
                const isImgUrl = iconUrl && /^https?:\/\//i.test(iconUrl);

                return (
                  <button
                    key={match.id}
                    type="button"
                    onClick={(e) => handleSelectMatch(match, e)}
                    style={{ left: `${x}px`, top: `${y}px` }}
                    aria-label={`Match marker: ${match.title}`}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label text-xs font-bold transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                      isSelected
                        ? 'bg-primary text-on-primary ring-4 ring-primary/30 z-20 scale-110'
                        : 'bg-light-surface-elevated dark:bg-dark-surface-elevated border border-primary text-light-on-surface dark:text-dark-on-surface hover:scale-105 z-10'
                    }`}
                  >
                    {isImgUrl ? (
                      <img src={iconUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
                    ) : (
                      <span className="text-sm leading-none">{getSportEmoji(match)}</span>
                    )}
                    <span className="tabular-nums">{slotsLeft}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Floating Map Status Overlay + Full Size / Minimize Toggle */}
          <div className="absolute top-3 inset-x-3 z-20 flex items-center justify-between gap-2 pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-light-surface/90 dark:bg-dark-surface/90 backdrop-blur-md border border-light-border dark:border-dark-border text-xs font-label text-light-muted dark:text-dark-muted shadow-sm">
              <FontAwesomeIcon icon={faLocationDot} className="text-primary" />
              <span className="font-semibold text-light-on-surface dark:text-dark-on-surface">
                {currentZone.label}
              </span>
              <span className="opacity-75">
                ({filteredMatches.length} match{filteredMatches.length === 1 ? '' : 'es'})
              </span>
            </div>

            <div className="pointer-events-auto flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-light-surface/90 dark:bg-dark-surface/90 backdrop-blur-md border border-light-border dark:border-dark-border text-xs font-body text-light-muted dark:text-dark-muted shadow-sm">
                <FontAwesomeIcon icon={faShieldHalved} className="text-success text-xs" />
                <span>Privacy Shield Active</span>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setIsFullScreen((prev) => !prev);
                }}
                aria-label={isFullScreen ? 'Minimize map view' : 'Expand map to full screen'}
                title={isFullScreen ? 'Minimize Map' : 'Full Size Map'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-light-surface/95 dark:bg-dark-surface/95 backdrop-blur-md border border-light-border dark:border-dark-border hover:border-primary text-xs font-label font-semibold text-light-on-surface dark:text-dark-on-surface shadow-sm transition-colors"
              >
                <FontAwesomeIcon icon={isFullScreen ? faCompress : faExpand} className="text-primary text-xs" />
                <span>{isFullScreen ? 'Minimize' : 'Full Size'}</span>
              </button>
            </div>
          </div>

          {/* Zoom and Locate Me Controls (Bottom Right, floating transparently over map tiles) */}
          <div className="absolute bottom-3 right-3 z-20 flex flex-col gap-1.5 pointer-events-none">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                if (mapMode === 'original' && leafletMapInstanceRef.current) {
                  leafletMapInstanceRef.current.zoomIn();
                } else {
                  setCustomZoom((z) => Math.min(z + 0.2, 1.8));
                }
              }}
              aria-label="Zoom in"
              className="pointer-events-auto w-8 h-8 rounded-md bg-light-surface/90 dark:bg-dark-surface/90 backdrop-blur-sm border border-light-border/80 dark:border-dark-border/80 flex items-center justify-center text-light-on-surface dark:text-dark-on-surface hover:border-primary shadow-sm transition-colors"
            >
              <FontAwesomeIcon icon={faPlus} className="text-xs" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                if (mapMode === 'original' && leafletMapInstanceRef.current) {
                  leafletMapInstanceRef.current.zoomOut();
                } else {
                  setCustomZoom((z) => Math.max(z - 0.2, 0.8));
                }
              }}
              aria-label="Zoom out"
              className="pointer-events-auto w-8 h-8 rounded-md bg-light-surface/90 dark:bg-dark-surface/90 backdrop-blur-sm border border-light-border/80 dark:border-dark-border/80 flex items-center justify-center text-light-on-surface dark:text-dark-on-surface hover:border-primary shadow-sm transition-colors"
            >
              <FontAwesomeIcon icon={faMinus} className="text-xs" />
            </button>
            <button
              type="button"
              onClick={handleLocateMe}
              disabled={isLocating}
              aria-label="Locate my position"
              title="Locate my position"
              className="pointer-events-auto w-8 h-8 rounded-md bg-light-surface/90 dark:bg-dark-surface/90 backdrop-blur-sm border border-light-border/80 dark:border-dark-border/80 flex items-center justify-center text-light-on-surface dark:text-dark-on-surface hover:border-primary shadow-sm transition-colors disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faLocationCrosshairs} className={`text-xs text-primary ${isLocating ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </section>

      {/* ========================================================================= */}
      {/* BELOW MAP ROW: Selected Match Card + Matches in Zone List (Side-by-side) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        <div className="lg:col-span-5 flex flex-col gap-4">
          {selectedMatch ? (
            <article className="rounded-xl bg-light-surface dark:bg-dark-surface border-2 border-primary p-5 flex flex-col gap-4 shadow-md transition-all duration-surface-enter">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-1 rounded-full bg-light-surface-elevated dark:bg-dark-surface-elevated text-primary font-label text-xs font-semibold">
                  {selectedMatch.sport}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full font-label text-xs font-semibold ${
                    selectedMatch.joinMode === 'Open Join'
                      ? 'bg-success text-on-success'
                      : selectedMatch.joinMode === 'Match Full'
                      ? 'bg-error text-on-error'
                      : 'bg-warning text-on-warning'
                  }`}
                >
                  {selectedMatch.joinMode}
                </span>
              </div>

              {selectedMatch.image && (
                <img
                  src={selectedMatch.image}
                  alt={selectedMatch.title}
                  className="w-full h-36 object-cover rounded-lg border border-light-border dark:border-dark-border"
                />
              )}

              <div>
                <h3 className="font-headline text-lg font-bold text-light-on-surface dark:text-dark-on-surface">
                  {selectedMatch.title}
                </h3>
                <p className="font-body text-xs text-light-muted dark:text-dark-muted mt-1">
                  {selectedMatch.venue} • {selectedMatch.area}
                </p>
              </div>

              <div className="flex flex-col gap-2 text-xs text-light-muted dark:text-dark-muted pt-2 border-t border-light-border dark:border-dark-border">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faClock} className="text-primary text-xs" />
                  <span className="tabular-nums font-medium text-light-on-surface dark:text-dark-on-surface">
                    {selectedMatch.schedule || selectedMatch.time}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faUsers} className="text-primary text-xs" />
                  <span className="tabular-nums">
                    {selectedMatch.filledSlots} / {selectedMatch.totalSlots} players ({selectedMatch.totalSlots - selectedMatch.filledSlots} slots left)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faTrophy} className="text-secondary dark:text-primary text-xs" />
                  <span>Level: {selectedMatch.skillLevel}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <Link to={`/matches/${selectedMatch.id}`} className="flex-1">
                  <Button variant="secondary" size="md" fullWidth>
                    View Details
                  </Button>
                </Link>
                {selectedMatch.joinMode !== 'Match Full' && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={(e) => {
                      if (e) e.preventDefault();
                      if (onJoinMatch) onJoinMatch(selectedMatch);
                    }}
                    icon={faArrowRight}
                    iconPosition="right"
                  >
                    Join
                  </Button>
                )}
              </div>
            </article>
          ) : (
            <div className="p-8 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-center text-light-muted dark:text-dark-muted font-body text-sm flex flex-col items-center gap-3">
              <FontAwesomeIcon icon={faLocationDot} className="text-3xl text-primary" />
              <p>No matches found matching your current filter in this zone.</p>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedZoneId('all');
                  setSearchQuery('');
                }}
                className="font-label text-xs font-semibold text-primary hover:underline"
              >
                Reset to All Bangladesh View
              </button>
            </div>
          )}
        </div>

        {/* Matches List Preview in Selected / Searched Area */}
        <div className="lg:col-span-7 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-4 sm:p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h4 className="font-headline text-xs sm:text-sm uppercase tracking-wider font-bold text-light-muted dark:text-dark-muted">
              Matches {searchedArea ? `Near ${searchedArea.label}` : `in ${currentZone.label}`} ({filteredMatches.length})
            </h4>
          </div>
          <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
            {filteredMatches.map((m) => {
              const isSelected = m.id === currentSelectedId;
              const slotsLeft = (m.totalSlots || 0) - (m.filledSlots || 0);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={(e) => handleSelectMatch(m, e)}
                  className={`text-left p-3 rounded-lg border transition-all flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'border-primary bg-light-surface-elevated dark:bg-dark-surface-elevated'
                      : 'border-light-border dark:border-dark-border hover:border-primary/60'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-headline text-xs sm:text-sm font-bold text-light-on-surface dark:text-dark-on-surface truncate">
                      {m.title}
                    </p>
                    <p className="font-body text-[11px] sm:text-xs text-light-muted dark:text-dark-muted truncate">
                      {m.venue} • {m.schedule || m.time}
                      {typeof m._areaDistKm === 'number' ? ` • ${m._areaDistKm.toFixed(1)} km` : ''}
                    </p>
                  </div>
                  <span className="font-label text-[11px] font-bold text-primary shrink-0 tabular-nums">
                    {slotsLeft > 0 ? `${slotsLeft} slots` : 'Full'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
