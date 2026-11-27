import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMapLocationDot,
  faPlus,
  faPenToSquare,
  faTrashCan,
  faLocationDot,
  faBuilding,
} from '@fortawesome/free-solid-svg-icons';
import { locationService } from '../../services/endpoints/locationService';
import LocationPickerMap from '../../components/common/LocationPickerMap';
import Modal from '../../components/modals/Modal';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import { toastService } from '../../components/feedback/toastService';

const BANGLADESH_DIVISIONS = [
  'Dhaka',
  'Chattogram',
  'Sylhet',
  'Rajshahi',
  'Khulna',
  'Barishal',
  'Rangpur',
  'Mymensingh',
];

const VENUE_TYPES = [
  { value: 'TURF', label: 'Turf' },
  { value: 'PLAYGROUND', label: 'Playground' },
  { value: 'STADIUM', label: 'Stadium' },
  { value: 'INDOOR_COURT', label: 'Indoor Court' },
  { value: 'FIELD', label: 'Open Field' },
];

export const AdminLocationsPage = () => {
  const [activeTab, setActiveTab] = useState('zones'); // 'zones' | 'venues'
  const [zones, setZones] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [divisionFilter, setDivisionFilter] = useState('All');

  // Zone modal
  const [zoneModalOpen, setZoneModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [zoneForm, setZoneForm] = useState({
    division: 'Dhaka',
    city: 'Dhaka',
    area: '',
    latitude: 23.8103,
    longitude: 90.4125,
    zoom: 14,
  });

  // Venue modal
  const [venueModalOpen, setVenueModalOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);
  const [venueForm, setVenueForm] = useState({
    name: '',
    venueType: 'TURF',
    zoneId: '',
    city: 'Dhaka',
    area: '',
    address: '',
    facilities: '',
    pricePerHour: '',
    latitude: 23.8103,
    longitude: 90.4125,
  });
  const [saving, setSaving] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      await locationService.getLocations(); // ensures default BD divisions exist if empty
      const [zRes, vRes] = await Promise.all([
        locationService.getAdminZones(),
        locationService.getAdminVenues(),
      ]);
      setZones(zRes.data || []);
      setVenues(vRes.data || []);
    } catch (err) {
      toastService.error(err?.message || 'Failed to load Bangladesh zones and venues.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const openNewZoneModal = () => {
    setEditingZone(null);
    setZoneForm({
      division: 'Dhaka',
      city: 'Dhaka',
      area: '',
      latitude: 23.8103,
      longitude: 90.4125,
      zoom: 14,
    });
    setZoneModalOpen(true);
  };

  const openEditZoneModal = (z) => {
    setEditingZone(z);
    setZoneForm({
      division: z.division || 'Dhaka',
      city: z.city || 'Dhaka',
      area: z.area || '',
      latitude: z.latitude ?? 23.8103,
      longitude: z.longitude ?? 90.4125,
      zoom: z.zoom ?? 14,
    });
    setZoneModalOpen(true);
  };

  const handleSaveZone = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...zoneForm,
        latitude: Number(zoneForm.latitude),
        longitude: Number(zoneForm.longitude),
        zoom: Number(zoneForm.zoom) || 14,
      };
      if (editingZone) {
        await locationService.updateZone(editingZone.id, payload);
        toastService.success('Zone updated!');
      } else {
        await locationService.createZone(payload);
        toastService.success('New Bangladesh zone added!');
      }
      setZoneModalOpen(false);
      await loadAll();
    } catch (err) {
      toastService.error(err?.message || 'Failed to save zone.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteZone = async (zone) => {
    try {
      await locationService.deleteZone(zone.id);
      toastService.success(`Deleted zone "${zone.area}".`);
      await loadAll();
    } catch (err) {
      toastService.error(err?.message || 'Unable to delete zone.');
    }
  };

  const openNewVenueModal = () => {
    setEditingVenue(null);
    const defaultZone = zones[0];
    setVenueForm({
      name: '',
      venueType: 'TURF',
      zoneId: defaultZone?.id || '',
      city: defaultZone?.city || 'Dhaka',
      area: defaultZone?.area || '',
      address: '',
      facilities: 'Floodlights, Parking, Drinking Water',
      pricePerHour: '',
      latitude: defaultZone?.latitude ?? 23.8103,
      longitude: defaultZone?.longitude ?? 90.4125,
    });
    setVenueModalOpen(true);
  };

  const openEditVenueModal = (v) => {
    setEditingVenue(v);
    setVenueForm({
      name: v.name || '',
      venueType: v.venueType || 'TURF',
      zoneId: v.zoneId || '',
      city: v.city || 'Dhaka',
      area: v.area || '',
      address: v.address || '',
      facilities: v.facilities || '',
      pricePerHour: v.pricePerHour ? String(v.pricePerHour) : '',
      latitude: v.latitude ?? 23.8103,
      longitude: v.longitude ?? 90.4125,
    });
    setVenueModalOpen(true);
  };

  const handleSaveVenue = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: venueForm.name,
        venueType: venueForm.venueType,
        zoneId: venueForm.zoneId || null,
        city: venueForm.city,
        area: venueForm.area || null,
        address: venueForm.address,
        facilities: venueForm.facilities || null,
        pricePerHour: venueForm.pricePerHour ? Number(venueForm.pricePerHour) : null,
        latitude: Number(venueForm.latitude),
        longitude: Number(venueForm.longitude),
      };
      if (editingVenue) {
        await locationService.updateVenue(editingVenue.id, payload);
        toastService.success('Venue updated!');
      } else {
        await locationService.createVenue(payload);
        toastService.success('Venue added to Bangladesh directory!');
      }
      setVenueModalOpen(false);
      await loadAll();
    } catch (err) {
      toastService.error(err?.message || 'Failed to save venue.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVenue = async (venue) => {
    try {
      await locationService.deleteVenue(venue.id);
      toastService.success(`Deleted venue "${venue.name}".`);
      await loadAll();
    } catch (err) {
      toastService.error(err?.message || 'Unable to delete venue.');
    }
  };

  const filteredZones =
    divisionFilter === 'All'
      ? zones
      : zones.filter((z) => String(z.division).toLowerCase() === divisionFilter.toLowerCase());

  return (
    <div className="max-w-7xl w-full mx-auto flex flex-col gap-6 pb-16">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-light-border dark:border-dark-border pb-4">
        <div>
          <h1 className="font-headline text-2xl font-bold flex items-center gap-2.5">
            <FontAwesomeIcon icon={faMapLocationDot} className="text-primary" />
            <span>Bangladesh Zones &amp; Venues Master Control</span>
          </h1>
          <p className="font-body text-xs sm:text-sm text-light-muted dark:text-dark-muted mt-1">
            Add and customize divisions, cities, areas, turfs, playgrounds, stadiums, and indoor courts across Bangladesh.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={openNewZoneModal}
            className="px-4 py-2 rounded-md border border-primary text-primary font-label text-xs font-semibold hover:bg-primary/10 flex items-center gap-1.5"
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Add Zone / Area</span>
          </button>
          <button
            type="button"
            onClick={openNewVenueModal}
            className="px-4 py-2 rounded-md bg-primary text-on-primary font-label text-xs font-semibold hover:opacity-90 flex items-center gap-1.5"
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Add Venue / Turf / Stadium</span>
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex flex-wrap p-1 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab('zones')}
            className={`px-4 py-2 rounded-md font-label text-xs font-semibold ${
              activeTab === 'zones'
                ? 'bg-primary text-on-primary'
                : 'text-light-muted dark:text-dark-muted'
            }`}
          >
            Zones &amp; Areas ({zones.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('venues')}
            className={`px-4 py-2 rounded-md font-label text-xs font-semibold ${
              activeTab === 'venues'
                ? 'bg-primary text-on-primary'
                : 'text-light-muted dark:text-dark-muted'
            }`}
          >
            Playgrounds, Turfs &amp; Stadiums ({venues.length})
          </button>
        </div>

        {activeTab === 'zones' && (
          <select
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
            className="px-3 py-2 rounded-md bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-xs font-label"
          >
            <option value="All">All 8 Divisions</option>
            {BANGLADESH_DIVISIONS.map((d) => (
              <option key={d} value={d}>{d} Division</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div className="py-16 flex justify-center">
          <LoadingSpinner size="lg" message="Loading Bangladesh locations..." />
        </div>
      ) : activeTab === 'zones' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredZones.map((z) => (
            <div
              key={z.id}
              className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-4 flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded bg-primary/15 text-primary font-label text-[11px] font-bold">
                    {z.division} Division
                  </span>
                  <span className="font-mono text-[11px] text-light-muted dark:text-dark-muted">
                    {z.latitude.toFixed(4)}, {z.longitude.toFixed(4)}
                  </span>
                </div>
                <h3 className="font-headline text-base font-bold mt-2">{z.area}</h3>
                <p className="font-body text-xs text-light-muted dark:text-dark-muted">
                  City / District: {z.city}
                </p>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-light-border dark:border-dark-border">
                <button
                  type="button"
                  onClick={() => openEditZoneModal(z)}
                  className="text-xs font-label font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <FontAwesomeIcon icon={faPenToSquare} />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteZone(z)}
                  className="text-xs font-label font-semibold text-error hover:underline flex items-center gap-1"
                >
                  <FontAwesomeIcon icon={faTrashCan} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {venues.length === 0 ? (
            <div className="col-span-full p-8 text-center rounded-lg border border-dashed border-light-border dark:border-dark-border text-sm text-light-muted dark:text-dark-muted">
              No playgrounds, turfs, or stadiums added yet. Click &ldquo;Add Venue / Turf / Stadium&rdquo; to create one anywhere in Bangladesh.
            </div>
          ) : (
            venues.map((v) => (
              <div
                key={v.id}
                className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-4 flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded bg-secondary/15 text-secondary font-label text-[11px] font-bold">
                      {v.venueType || 'TURF'}
                    </span>
                    {v.pricePerHour ? (
                      <span className="font-mono text-xs text-primary font-semibold">
                        BDT {v.pricePerHour}/hr
                      </span>
                    ) : null}
                  </div>
                  <h3 className="font-headline text-base font-bold mt-2">{v.name}</h3>
                  <p className="font-body text-xs text-light-muted dark:text-dark-muted mt-0.5">
                    <FontAwesomeIcon icon={faLocationDot} className="text-primary mr-1" />
                    {[v.area, v.city].filter(Boolean).join(', ')} • {v.address}
                  </p>
                  {v.facilities && (
                    <p className="font-body text-[11px] text-light-muted dark:text-dark-muted mt-1">
                      Facilities: {v.facilities}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-light-border dark:border-dark-border">
                  <button
                    type="button"
                    onClick={() => openEditVenueModal(v)}
                    className="text-xs font-label font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <FontAwesomeIcon icon={faPenToSquare} />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteVenue(v)}
                    className="text-xs font-label font-semibold text-error hover:underline flex items-center gap-1"
                  >
                    <FontAwesomeIcon icon={faTrashCan} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Zone Modal */}
      <Modal
        isOpen={zoneModalOpen}
        onClose={() => setZoneModalOpen(false)}
        title={editingZone ? 'Edit Zone / Area' : 'Add Zone / Area in Bangladesh'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveZone} className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-label font-semibold">Division</span>
              <input
                type="text"
                required
                list="bd-divisions"
                value={zoneForm.division}
                onChange={(e) => setZoneForm((p) => ({ ...p, division: e.target.value }))}
                className="px-3 py-2 rounded border border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background text-sm"
              />
              <datalist id="bd-divisions">
                {BANGLADESH_DIVISIONS.map((d) => <option key={d} value={d} />)}
              </datalist>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-label font-semibold">City / District</span>
              <input
                type="text"
                required
                value={zoneForm.city}
                onChange={(e) => setZoneForm((p) => ({ ...p, city: e.target.value }))}
                placeholder="e.g. Dhaka, Chattogram, Bogura"
                className="px-3 py-2 rounded border border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background text-sm"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-label font-semibold">Zone / Neighborhood / Upazila</span>
            <input
              type="text"
              required
              value={zoneForm.area}
              onChange={(e) => setZoneForm((p) => ({ ...p, area: e.target.value }))}
              placeholder="e.g. Dhanmondi, GEC Circle, Zindabazar"
              className="px-3 py-2 rounded border border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background text-sm"
            />
          </label>

          <LocationPickerMap
            latitude={zoneForm.latitude}
            longitude={zoneForm.longitude}
            onChange={(lat, lng) => setZoneForm((p) => ({ ...p, latitude: lat, longitude: lng }))}
          />

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setZoneModalOpen(false)} className="px-4 py-2 rounded border text-xs">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded bg-primary text-on-primary text-xs font-semibold">
              {saving ? 'Saving...' : 'Save Zone'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Venue Modal */}
      <Modal
        isOpen={venueModalOpen}
        onClose={() => setVenueModalOpen(false)}
        title={editingVenue ? 'Edit Venue / Turf / Stadium' : 'Add Playground, Turf or Stadium'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveVenue} className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-label font-semibold">Venue Name</span>
              <input
                type="text"
                required
                value={venueForm.name}
                onChange={(e) => setVenueForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Bashundhara Kings Arena Turf"
                className="px-3 py-2 rounded border border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background text-sm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-label font-semibold">Facility Type</span>
              <select
                value={venueForm.venueType}
                onChange={(e) => setVenueForm((p) => ({ ...p, venueType: e.target.value }))}
                className="px-3 py-2 rounded border border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background text-sm"
              >
                {VENUE_TYPES.map((vt) => (
                  <option key={vt.value} value={vt.value}>{vt.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-label font-semibold">Zone Preset</span>
              <select
                value={venueForm.zoneId}
                onChange={(e) => {
                  const chosen = zones.find((z) => z.id === e.target.value);
                  setVenueForm((p) => ({
                    ...p,
                    zoneId: e.target.value,
                    ...(chosen
                      ? {
                          city: chosen.city,
                          area: chosen.area,
                          latitude: chosen.latitude,
                          longitude: chosen.longitude,
                        }
                      : {}),
                  }));
                }}
                className="px-3 py-2 rounded border border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background text-sm"
              >
                <option value="">Custom Coordinates</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>{z.area} ({z.city})</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-label font-semibold">City</span>
              <input
                type="text"
                required
                value={venueForm.city}
                onChange={(e) => setVenueForm((p) => ({ ...p, city: e.target.value }))}
                className="px-3 py-2 rounded border border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background text-sm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-label font-semibold">Area</span>
              <input
                type="text"
                value={venueForm.area}
                onChange={(e) => setVenueForm((p) => ({ ...p, area: e.target.value }))}
                className="px-3 py-2 rounded border border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background text-sm"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-label font-semibold">Street Address</span>
            <input
              type="text"
              required
              value={venueForm.address}
              onChange={(e) => setVenueForm((p) => ({ ...p, address: e.target.value }))}
              placeholder="Road, Sector, Block..."
              className="px-3 py-2 rounded border border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background text-sm"
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-label font-semibold">Facilities</span>
              <input
                type="text"
                value={venueForm.facilities}
                onChange={(e) => setVenueForm((p) => ({ ...p, facilities: e.target.value }))}
                placeholder="Floodlights, Washroom, Parking"
                className="px-3 py-2 rounded border border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background text-sm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-label font-semibold">Rate (BDT / hr, optional)</span>
              <input
                type="number"
                min="0"
                value={venueForm.pricePerHour}
                onChange={(e) => setVenueForm((p) => ({ ...p, pricePerHour: e.target.value }))}
                className="px-3 py-2 rounded border border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background text-sm"
              />
            </label>
          </div>

          <LocationPickerMap
            latitude={venueForm.latitude}
            longitude={venueForm.longitude}
            onChange={(lat, lng) => setVenueForm((p) => ({ ...p, latitude: lat, longitude: lng }))}
          />

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setVenueModalOpen(false)} className="px-4 py-2 rounded border text-xs">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded bg-primary text-on-primary text-xs font-semibold">
              {saving ? 'Saving...' : 'Save Venue'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminLocationsPage;
