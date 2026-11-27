import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import apiClient from '../services/api/apiClient';
import { unwrapEnvelope, normalizeMatch, normalizeSport } from '../utils/dtoMappers';

const MATCHES_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes client TTL
const SPORTS_CACHE_TTL_MS = 5 * 60 * 1000;  // 5 minutes client TTL
const LOCATIONS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes client TTL

export const useAppStore = create(
  persist(
    (set, get) => ({
      // Cached User Profile (browser storage + in-memory)
      cachedUser: null,
      userCachedAt: null,

      // Sports Catalog
      sports: [],
      sportsFetchedAt: null,
      sportsLoading: false,

      // Bangladesh Zones & Venues
      zones: [],
      venues: [],
      locationsFetchedAt: null,
      locationsLoading: false,

      // Matches Pool (used for client-side search, filter, and sorting without extra DB fetches)
      matches: [],
      matchesFetchedAt: null,
      matchesLoading: false,
      matchesVersion: 0,

      // User Geolocation (for area-first discovery & distance sorting)
      userLocation: null, // { lat, lng, updatedAt }
      locationPermissionState: 'idle', // 'idle' | 'granted' | 'denied' | 'unsupported'

      // Admin Workspace Preview Role ('ADMIN' | 'PLAYER' | 'ORGANIZER')
      adminPreviewRole: 'ADMIN',
      setAdminPreviewRole: (previewRole) =>
        set({ adminPreviewRole: previewRole || 'ADMIN' }),

      setCachedUser: (user) =>
        set({
          cachedUser: user || null,
          userCachedAt: user ? Date.now() : null,
        }),

      clearCachedUser: () =>
        set({
          cachedUser: null,
          userCachedAt: null,
        }),

      fetchSports: async ({ force = false } = {}) => {
        const { sports, sportsFetchedAt, sportsLoading } = get();
        if (
          !force &&
          sports.length > 0 &&
          sportsFetchedAt &&
          Date.now() - sportsFetchedAt < SPORTS_CACHE_TTL_MS
        ) {
          return sports;
        }
        if (sportsLoading && !force) return sports;

        set({ sportsLoading: true });
        try {
          const response = await apiClient.get('/sports');
          const raw = unwrapEnvelope(response);
          const list = Array.isArray(raw) ? raw.map(normalizeSport) : [];
          set({
            sports: list,
            sportsFetchedAt: Date.now(),
            sportsLoading: false,
          });
          return list;
        } catch {
          set({ sportsLoading: false });
          return get().sports;
        }
      },

      invalidateSports: async () => {
        set({ sportsFetchedAt: null });
        return get().fetchSports({ force: true });
      },

      fetchLocations: async ({ force = false } = {}) => {
        const { zones, venues, locationsFetchedAt, locationsLoading } = get();
        if (
          !force &&
          zones.length > 0 &&
          locationsFetchedAt &&
          Date.now() - locationsFetchedAt < LOCATIONS_CACHE_TTL_MS
        ) {
          return { zones, venues };
        }
        if (locationsLoading && !force) return { zones, venues };

        set({ locationsLoading: true });
        try {
          const response = await apiClient.get('/locations');
          const raw = unwrapEnvelope(response) || {};
          const nextZones = Array.isArray(raw.zones) ? raw.zones : [];
          const nextVenues = Array.isArray(raw.venues) ? raw.venues : [];
          set({
            zones: nextZones,
            venues: nextVenues,
            locationsFetchedAt: Date.now(),
            locationsLoading: false,
          });
          return { zones: nextZones, venues: nextVenues };
        } catch {
          set({ locationsLoading: false });
          return { zones: get().zones, venues: get().venues };
        }
      },

      invalidateLocations: async () => {
        set({ locationsFetchedAt: null });
        return get().fetchLocations({ force: true });
      },

      fetchMatches: async ({ force = false } = {}) => {
        const { matches, matchesFetchedAt, matchesLoading } = get();
        if (
          !force &&
          matches.length > 0 &&
          matchesFetchedAt &&
          Date.now() - matchesFetchedAt < MATCHES_CACHE_TTL_MS
        ) {
          return matches;
        }
        if (matchesLoading && !force) return matches;

        set({ matchesLoading: true });
        try {
          const response = await apiClient.get('/matches', {
            params: { page: 0, size: 100 },
          });
          const pageData = unwrapEnvelope(response);
          const rawList = Array.isArray(pageData?.content)
            ? pageData.content
            : Array.isArray(pageData)
              ? pageData
              : [];
          const list = rawList.map(normalizeMatch);
          set((state) => ({
            matches: list,
            matchesFetchedAt: Date.now(),
            matchesLoading: false,
            matchesVersion: state.matchesVersion + 1,
          }));
          return list;
        } catch {
          set({ matchesLoading: false });
          return get().matches;
        }
      },

      upsertMatchInCache: (matchDto) => {
        if (!matchDto?.id) return;
        set((state) => {
          const exists = state.matches.some((m) => m.id === matchDto.id);
          const nextMatches = exists
            ? state.matches.map((m) => (m.id === matchDto.id ? { ...m, ...matchDto } : m))
            : [matchDto, ...state.matches];
          return {
            matches: nextMatches,
            matchesFetchedAt: Date.now(),
            matchesVersion: state.matchesVersion + 1,
          };
        });
      },

      invalidateMatches: async ({ refetch = true } = {}) => {
        set({ matchesFetchedAt: null });
        if (refetch) {
          return get().fetchMatches({ force: true });
        }
        return get().matches;
      },

      setUserLocation: (coords) =>
        set({
          userLocation: coords ? { ...coords, updatedAt: Date.now() } : null,
          locationPermissionState: coords ? 'granted' : get().locationPermissionState,
        }),

      detectUserLocation: ({ force = false } = {}) =>
        new Promise((resolve) => {
          const existing = get().userLocation;
          if (!force && existing && Date.now() - existing.updatedAt < 10 * 60_000) {
            resolve(existing);
            return;
          }

          if (typeof navigator === 'undefined' || !navigator.geolocation) {
            set({ locationPermissionState: 'unsupported' });
            resolve(null);
            return;
          }

          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const loc = {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                updatedAt: Date.now(),
              };
              set({ userLocation: loc, locationPermissionState: 'granted' });
              resolve(loc);
            },
            () => {
              set({ locationPermissionState: 'denied' });
              resolve(null);
            },
            { enableHighAccuracy: false, timeout: 7000, maximumAge: 300_000 }
          );
        }),
    }),
    {
      name: 'khela-hobe-app-cache',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        cachedUser: state.cachedUser,
        userCachedAt: state.userCachedAt,
        sports: state.sports,
        sportsFetchedAt: state.sportsFetchedAt,
        zones: state.zones,
        venues: state.venues,
        locationsFetchedAt: state.locationsFetchedAt,
        matches: state.matches,
        matchesFetchedAt: state.matchesFetchedAt,
        userLocation: state.userLocation,
        adminPreviewRole: state.adminPreviewRole,
      }),
    }
  )
);

export default useAppStore;
