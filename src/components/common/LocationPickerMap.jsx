import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLocationCrosshairs, faLocationDot } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../../hooks/useTheme';

/**
 * Interactive Leaflet Location Picker for pinpointing a match venue/coordinates
 */
export const LocationPickerMap = ({
  latitude = 23.8103,
  longitude = 90.4125,
  onChange,
  heightClass = 'h-64',
}) => {
  const { isDark } = useTheme();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const tileRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const [locating, setLocating] = useState(false);

  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapRef.current) {
      const map = L.map(containerRef.current, {
        center: [latitude, longitude],
        zoom: 14,
        zoomControl: true,
        attributionControl: false,
      });

      const pinIcon = L.divIcon({
        className: 'match-picker-pin',
        html: `<div style="width:26px;height:26px;border-radius:9999px;background:#B9F34A;border:3px solid #131F00;box-shadow:0 4px 12px rgba(0,0,0,0.4);transform:translate(-50%,-50%);display:flex;align-items:center;justify-content:center;"><span style="width:8px;height:8px;border-radius:9999px;background:#131F00;"></span></div>`,
        iconSize: [0, 0],
      });

      const marker = L.marker([latitude, longitude], {
        draggable: true,
        icon: pinIcon,
      }).addTo(map);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onChangeRef.current?.(
          Number(pos.lat.toFixed(6)),
          Number(pos.lng.toFixed(6))
        );
      });

      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        onChangeRef.current?.(Number(lat.toFixed(6)), Number(lng.toFixed(6)));
      });

      mapRef.current = map;
      markerRef.current = marker;

      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    }
  }, []);

  // Update tile layer when theme changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileRef.current) {
      map.removeLayer(tileRef.current);
    }

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

    tileRef.current = tiles;
  }, [isDark]);

  // Sync external lat/lng changes (e.g., when loading match in edit mode)
  useEffect(() => {
    if (mapRef.current && markerRef.current && typeof latitude === 'number' && typeof longitude === 'number') {
      const current = markerRef.current.getLatLng();
      if (Math.abs(current.lat - latitude) > 0.00001 || Math.abs(current.lng - longitude) > 0.00001) {
        markerRef.current.setLatLng([latitude, longitude]);
        mapRef.current.panTo([latitude, longitude], { animate: true });
      }
    }
  }, [latitude, longitude]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        if (markerRef.current && mapRef.current) {
          markerRef.current.setLatLng([lat, lng]);
          mapRef.current.flyTo([lat, lng], 15, { duration: 0.9 });
        }
        onChange?.(lat, lng);
      },
      () => {
        setLocating(false);
      },
      { timeout: 7000 }
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-body text-xs text-light-muted dark:text-dark-muted flex items-center gap-1.5">
          <FontAwesomeIcon icon={faLocationDot} className="text-primary" />
          <span>Click on the map or drag the pin to pinpoint the exact match venue.</span>
        </span>

        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={locating}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border hover:border-primary font-label text-xs font-semibold text-primary transition-colors disabled:opacity-50"
        >
          <FontAwesomeIcon icon={faLocationCrosshairs} className={locating ? 'animate-spin' : ''} />
          <span>{locating ? 'Locating...' : 'Pin My Current Location'}</span>
        </button>
      </div>

      <div
        ref={containerRef}
        className={`w-full ${heightClass} rounded-md border border-light-border dark:border-dark-border overflow-hidden z-0`}
      />

      <div className="flex items-center justify-between text-[11px] font-mono text-light-muted dark:text-dark-muted">
        <span>Pinned Lat: {Number(latitude).toFixed(5)}</span>
        <span>Pinned Lng: {Number(longitude).toFixed(5)}</span>
      </div>
    </div>
  );
};

export default LocationPickerMap;
