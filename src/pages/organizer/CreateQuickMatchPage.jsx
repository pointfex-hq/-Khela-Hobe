import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faPlus,
  faTrashCan,
  faFloppyDisk,
  faPaperPlane,
  faClock,
  faLocationDot,
  faUsers,
  faShieldHalved,
  faCircleCheck,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../hooks/useAuth';
import { matchService } from '../../services/endpoints/matchService';
import { uploadService } from '../../services/endpoints/uploadService';
import { useAppStore } from '../../store/useAppStore';
import { toBackendSkillLevel } from '../../utils/dtoMappers';
import {
  MATCH_GENDER_OPTIONS,
  formatMatchGenderLabel,
  formatMatchAgeLabel,
} from '../../utils/matchEligibility';
import { toastService } from '../../components/feedback/toastService';
import LocationPickerMap from '../../components/common/LocationPickerMap';
import { ROUTES } from '../../constants/routes';

export const CreateQuickMatchPage = ({ isEdit = false }) => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [pinnedLat, setPinnedLat] = useState(23.8103);
  const [pinnedLng, setPinnedLng] = useState(90.4125);
  const [selectedCity, setSelectedCity] = useState('Dhaka');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [sportsCatalog, setSportsCatalog] = useState([]);
  const zonesCatalog = useAppStore((s) => s.zones);
  const venuesCatalog = useAppStore((s) => s.venues);
  const fetchLocations = useAppStore((s) => s.fetchLocations);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  // Dynamic equipment list
  const [equipmentList, setEquipmentList] = useState([]);
  const [newEquipName, setNewEquipName] = useState('');
  const [newEquipQty, setNewEquipQty] = useState(1);
  const [showAddEquip, setShowAddEquip] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: '',
      sport: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      startTime: '18:00',
      duration: '90 mins',
      venue: '',
      minPlayers: 2,
      maxPlayers: 10,
      skillLevel: 'Intermediate',
      genderRestriction: 'ALL',
      minAge: 0,
      maxAge: 99,
      joinMode: 'open', // 'open' | 'approval'
      turfFee: '',
      equipmentFee: '',
      allowOnlinePayment: true,
    },
  });

  const isFullOrganizer = Boolean(
    user?.isVerifiedOrganizer || (user?.roles || []).includes('ADMIN')
  );

  // Watch form fields for live preview
  const watchedValues = watch();

  // Load sports catalog from GET /sports so sportId matches backend UUIDs
  useEffect(() => {
    matchService
      .getSportsList()
      .then((res) => {
        if (Array.isArray(res?.data) && res.data.length > 0) {
          setSportsCatalog(res.data);
          if (!matchId && !isEdit) {
            setValue('sport', res.data[0].id);
          }
        }
      })
      .catch(() => {});
  }, [matchId, isEdit, setValue]);

  // If edit mode, load existing match
  useEffect(() => {
    if (matchId) {
      setFetchLoading(true);
      matchService
        .getMatchById(matchId)
        .then((res) => {
          if (res?.data) {
            const m = res.data;
            setCoverImageUrl(m.coverImageUrl || '');
            if (typeof m.coordinates?.lat === 'number' && typeof m.coordinates?.lng === 'number') {
              setPinnedLat(m.coordinates.lat);
              setPinnedLng(m.coordinates.lng);
            }
            reset({
              title: m.title || '',
              sport: m.sportId || m.sport || '',
              description: m.description || '',
              date: m.date || new Date().toISOString().split('T')[0],
              startTime: m.time?.split(' – ')[0] || '18:00',
              duration: '90 mins',
              venue: m.venue || m.area || '',
              minPlayers: m.minPlayers || 2,
              maxPlayers: m.totalSlots || 10,
              skillLevel: m.skillLevel || 'Intermediate',
              genderRestriction: m.genderRestriction || 'ALL',
              minAge: typeof m.minAge === 'number' ? m.minAge : 0,
              maxAge: typeof m.maxAge === 'number' ? m.maxAge : 99,
              joinMode: m.mode === 'APPLICATION_REQUIRED' ? 'approval' : 'open',
              turfFee: m.feeAmount ? String(m.feeAmount) : '',
              equipmentFee: m.equipmentFee ? String(m.equipmentFee) : '',
              allowOnlinePayment: m.allowOnlinePayment ?? true,
            });
            if (m.equipment && m.equipment.length > 0) {
              setEquipmentList(
                m.equipment.map((eq, i) => ({
                  id: eq.id || `eq_${i}`,
                  dbId: eq.id,
                  name: eq.name,
                  quantity: eq.required || eq.quantity || 1,
                }))
              );
            }
          }
        })
        .catch(() => {
          toastService.error('Failed to load match details for editing.');
        })
        .finally(() => {
          setFetchLoading(false);
        });
    }
  }, [matchId, isEdit, reset]);

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toastService.error('Cover image must be 5 MB or smaller.');
      return;
    }
    setUploadingCover(true);
    try {
      const res = await uploadService.uploadImage(file, 'matches');
      if (res?.url) {
        setCoverImageUrl(res.url);
        toastService.success('Match cover image uploaded!');
      }
    } catch (err) {
      toastService.error(err?.message || 'Failed to upload cover image.');
    } finally {
      setUploadingCover(false);
    }
  };

  // Handle Equipment Add
  const handleAddEquipment = (e) => {
    e.preventDefault();
    if (!newEquipName.trim()) return;
    setEquipmentList((prev) => [
      ...prev,
      {
        id: `eq_${Date.now()}`,
        name: newEquipName.trim(),
        quantity: parseInt(newEquipQty, 10) || 1,
      },
    ]);
    setNewEquipName('');
    setNewEquipQty(1);
    setShowAddEquip(false);
    toastService.success('Equipment item added to match requirements.');
  };

  const handleRemoveEquipment = (id) => {
    setEquipmentList((prev) => prev.filter((item) => item.id !== id));
  };

  // Submit Handler
  const onSubmit = async (data, isDraft = false) => {
    setLoading(true);

    // Compute ISO-8601 startTime and endTime from date, startTime, duration
    const durationMinutes = parseInt(data.duration, 10) || 90;
    const startDt = new Date(`${data.date}T${data.startTime || '18:00'}:00`);
    const endDt = new Date(startDt.getTime() + durationMinutes * 60 * 1000);

    // Match sport name/id to backend SportDto UUID
    const matchedSport = sportsCatalog.find(
      (s) =>
        s.id === data.sport ||
        s.name?.toLowerCase().includes(String(data.sport).toLowerCase()) ||
        s.slug?.toLowerCase() === String(data.sport).toLowerCase()
    );

    const parsedFee = parseFloat(String(data.turfFee || '0').replace(/[^\d.]/g, '')) || 0;
    const parsedEquipmentFee =
      parseFloat(String(data.equipmentFee || '0').replace(/[^\d.]/g, '')) || 0;

    const minAge = Math.max(0, Math.min(99, parseInt(String(data.minAge ?? 0), 10) || 0));
    const maxAge = Math.max(5, Math.min(99, parseInt(String(data.maxAge ?? 99), 10) || 99));
    if (minAge > maxAge) {
      toastService.error('Minimum age cannot exceed maximum age.');
      setLoading(false);
      return;
    }

    const payload = {
      title: data.title,
      description: data.description || undefined,
      sportId: matchedSport?.id || data.sport,
      ...(selectedVenueId ? { venueId: selectedVenueId } : {}),
      location: {
        name: data.venue,
        area: selectedArea || data.venue,
        city: selectedCity || 'Dhaka',
        latitude: pinnedLat,
        longitude: pinnedLng,
        source: 'MAP_PIN',
      },
      startTime: startDt.toISOString(),
      endTime: endDt.toISOString(),
      capacity: Math.max(2, Math.min(200, parseInt(data.maxPlayers, 10) || 10)),
      mode: data.joinMode === 'approval' ? 'APPLICATION_REQUIRED' : 'INSTANT_JOIN',
      skillLevel: toBackendSkillLevel(data.skillLevel),
      genderRestriction: data.genderRestriction || 'ALL',
      minAge,
      maxAge,
      feeAmount: parsedFee,
      equipmentFee: parsedEquipmentFee,
      allowOnlinePayment: isFullOrganizer ? Boolean(data.allowOnlinePayment) : false,
      ...(coverImageUrl ? { coverImageUrl } : {}),
      equipment: equipmentList.map((eq) => ({
        ...(eq.dbId ? { id: eq.dbId } : {}),
        name: eq.name,
        quantity: Math.max(1, Number(eq.quantity) || 1),
      })),
    };

    try {
      if (matchId) {
        await matchService.updateMatch(matchId, payload);
        toastService.success('Match updated successfully!');
        navigate(`${ROUTES.ORGANIZER_MATCH_MANAGEMENT.replace(':matchId', matchId)}`);
      } else {
        await matchService.createMatch(payload);
        toastService.success(isDraft ? 'Match saved!' : 'Match published live!');
        navigate(ROUTES.ORGANIZER_MATCHES);
      }
    } catch (err) {
      toastService.error(err?.message || 'An error occurred while saving the match.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Contextual Header */}
      <header className="min-h-16 py-2 border-b border-light-border dark:border-dark-border px-2 sm:px-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to={ROUTES.ORGANIZER_MATCHES}
            className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border hover:border-primary text-light-muted dark:text-dark-muted hover:text-light-on-surface dark:hover:text-dark-on-surface transition-colors"
            aria-label="Back to My Matches"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
          </Link>
          <div>
            <h1 className="font-headline text-title-lg font-bold">
              {matchId ? 'Edit Match Details' : 'Create Quick Match'}
            </h1>
            <p className="font-body text-body-sm text-light-muted dark:text-dark-muted">
              {matchId ? 'Modify match schedule, rules or venue' : 'Set up and broadcast recreational match'}
            </p>
          </div>
          <span className="shrink-0 px-2.5 py-1 rounded-full bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border font-label text-label-sm text-primary">
            Instant Publish
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            disabled={loading}
            onClick={handleSubmit((data) => onSubmit(data, true))}
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-light-surface dark:bg-dark-surface text-light-on-surface dark:text-dark-on-surface border border-light-border dark:border-dark-border font-label text-label-md transition-colors hover:bg-light-surface-elevated dark:hover:bg-dark-surface-elevated disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faFloppyDisk} className="text-sm" />
            <span>Save Draft</span>
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleSubmit((data) => onSubmit(data, false))}
            className="shrink-0 inline-flex items-center gap-2 px-5 py-2 rounded-md bg-primary text-on-primary font-label text-label-md font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faPaperPlane} className="text-sm" />
            <span>{matchId ? 'Save Changes' : 'Publish Match'}</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Grid (8 cols form + 4 cols preview) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Sections (8 columns) */}
        <form onSubmit={handleSubmit((data) => onSubmit(data, false))} className="lg:col-span-8 flex flex-col gap-6">
          {/* Section 1: Basic Information */}
          <section className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-6 flex flex-col gap-4">
            <h2 className="font-headline text-title-lg font-bold">1. Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="font-label text-label-md">Match Title</span>
                <input
                  type="text"
                  {...register('title', { required: 'Title is required' })}
                  placeholder="e.g. Uttara Sector 11 Floodlit 7v7"
                  className="w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                />
                {errors.title && <span className="text-error text-xs">{errors.title.message}</span>}
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="font-label text-label-md">Sport</span>
                <select
                  {...register('sport', { required: true })}
                  className="w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  {sportsCatalog.length > 0 ? (
                    sportsCatalog.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Badminton">Badminton</option>
                      <option value="Football">Football 7v7</option>
                      <option value="Cricket">Cricket (Tape-Ball)</option>
                      <option value="Basketball">Basketball 3x3</option>
                      <option value="Table Tennis">Table Tennis</option>
                      <option value="Volleyball">Volleyball</option>
                    </>
                  )}
                </select>
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="font-label text-label-md">Description &amp; Rules</span>
              <textarea
                rows={3}
                {...register('description')}
                placeholder="Share rules, attire guidelines, turf details, or rotation policies..."
                className="w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none resize-none"
              />
            </label>

            <div className="flex flex-col gap-2">
              <span className="font-label text-label-md">Cover Image (Optional)</span>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleCoverUpload}
                  disabled={uploadingCover}
                  className="text-xs font-body text-light-muted dark:text-dark-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-light-border dark:file:border-dark-border file:bg-light-surface-elevated dark:file:bg-dark-surface-elevated file:font-label file:text-xs"
                />
                {uploadingCover && (
                  <span className="text-xs text-primary font-label">Uploading to S3...</span>
                )}
                {coverImageUrl && (
                  <button
                    type="button"
                    onClick={() => setCoverImageUrl('')}
                    className="text-xs text-error font-label hover:underline"
                  >
                    Remove Cover
                  </button>
                )}
              </div>
              {coverImageUrl && (
                <img
                  src={coverImageUrl}
                  alt="Match cover preview"
                  className="w-full max-w-sm h-32 object-cover rounded-md border border-light-border dark:border-dark-border mt-1"
                />
              )}
            </div>
          </section>

          {/* Section 2: Schedule & Venue (Asia/Dhaka) */}
          <section className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-headline text-title-lg font-bold">2. Schedule &amp; Venue (Asia/Dhaka)</h2>
              <span className="font-body text-body-sm text-light-muted dark:text-dark-muted">
                GMT+6 Bangladesh Standard Time
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="font-label text-label-md">Match Date</span>
                <input
                  type="date"
                  {...register('date', { required: true })}
                  className="w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md tabular-nums focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="font-label text-label-md">Start Time</span>
                <input
                  type="time"
                  {...register('startTime', { required: true })}
                  className="w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md tabular-nums focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="font-label text-label-md">Duration</span>
                <select
                  {...register('duration')}
                  className="w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="60 mins">60 mins</option>
                  <option value="90 mins">90 mins</option>
                  <option value="120 mins">120 mins</option>
                </select>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="font-label text-label-md">Pick Saved Venue / Turf (Optional)</span>
                <select
                  value={selectedVenueId}
                  onChange={(e) => {
                    const vid = e.target.value;
                    setSelectedVenueId(vid);
                    const v = venuesCatalog.find((item) => item.id === vid);
                    if (v) {
                      setValue('venue', v.name);
                      setSelectedCity(v.city || 'Dhaka');
                      setSelectedArea(v.area || v.name);
                      setPinnedLat(v.latitude);
                      setPinnedLng(v.longitude);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md focus:border-primary focus:outline-none"
                >
                  <option value="">Custom Venue Name &amp; Map Pin</option>
                  {venuesCatalog.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.venueType} • {v.area || v.city})
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="font-label text-label-md">Bangladesh Zone / City</span>
                <select
                  value={selectedArea}
                  onChange={(e) => {
                    const chosenArea = e.target.value;
                    setSelectedArea(chosenArea);
                    const z = zonesCatalog.find((item) => item.area === chosenArea);
                    if (z) {
                      setSelectedCity(z.city);
                      setPinnedLat(z.latitude);
                      setPinnedLng(z.longitude);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md focus:border-primary focus:outline-none"
                >
                  <option value="">Select Zone / Area</option>
                  {zonesCatalog.map((z) => (
                    <option key={z.id} value={z.area}>
                      {z.area}, {z.city} ({z.division})
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <label className="md:col-span-2 flex flex-col gap-1.5">
                <span className="font-label text-label-md">Venue or Area</span>
                <input
                  type="text"
                  {...register('venue', { required: 'Venue is required' })}
                  placeholder="e.g. Gazipur Sadar Indoor Hall, Joydebpur Road"
                  className="w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                />
                {errors.venue && <span className="text-error text-xs">{errors.venue.message}</span>}
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="font-label text-label-md">Turf Fee (BDT)</span>
                <input
                  type="number"
                  min="0"
                  {...register('turfFee')}
                  placeholder="e.g. 250"
                  className="w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="font-label text-label-md">Equipment Fee (BDT)</span>
                <input
                  type="number"
                  min="0"
                  {...register('equipmentFee')}
                  placeholder="e.g. 50"
                  className="w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </label>
            </div>

            {isFullOrganizer ? (
              <label className="flex items-center gap-2.5 text-xs text-light-muted dark:text-dark-muted cursor-pointer">
                <input
                  type="checkbox"
                  {...register('allowOnlinePayment')}
                  className="rounded accent-primary w-4 h-4"
                />
                <span>
                  Allow players to pay match fee online via SSLCommerz (in addition to Pay at Venue)
                </span>
              </label>
            ) : (
              <div className="p-3 rounded-md bg-warning/10 border border-warning/30 text-xs text-warning font-medium">
                Quick Match Host mode: Turf &amp; Equipment fees are strictly payable at the venue. Online SSLCommerz checkout is reserved for Full Organizers.
              </div>
            )}

            {/* Interactive Map Location Pinpoint */}
            <div className="pt-2 border-t border-light-border dark:border-dark-border">
              <span className="font-label text-label-md block mb-2">
                Pinpoint Match Location on Map
              </span>
              <LocationPickerMap
                latitude={pinnedLat}
                longitude={pinnedLng}
                onChange={(lat, lng) => {
                  setPinnedLat(lat);
                  setPinnedLng(lng);
                }}
              />
            </div>
          </section>

          {/* Section 3: Capacity & Participation Mode */}
          <section className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-6 flex flex-col gap-4">
            <h2 className="font-headline text-title-lg font-bold">3. Capacity &amp; Participation Mode</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="font-label text-label-md">Min Players</span>
                <input
                  type="number"
                  min="2"
                  max="50"
                  {...register('minPlayers', { required: true, min: 2 })}
                  className="w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md tabular-nums focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="font-label text-label-md">Max Players</span>
                <input
                  type="number"
                  min="2"
                  max="50"
                  {...register('maxPlayers', { required: true, min: 2 })}
                  className="w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md tabular-nums focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="font-label text-label-md">Skill Level</span>
                <select
                  {...register('skillLevel')}
                  className="w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="All Levels">All Levels</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Competitive">Competitive</option>
                </select>
              </label>
            </div>

            {/* Gender Eligibility & Age Range Limits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <label className="flex flex-col gap-1.5">
                <span className="font-label text-label-md">Gender Eligibility</span>
                <select
                  {...register('genderRestriction')}
                  className="w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  {MATCH_GENDER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="font-label text-label-md">Minimum Age (0 = Any)</span>
                <input
                  type="number"
                  min="0"
                  max="99"
                  {...register('minAge', { min: 0, max: 99 })}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md tabular-nums focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="font-label text-label-md">Maximum Age (99 = Any)</span>
                <input
                  type="number"
                  min="5"
                  max="99"
                  {...register('maxAge', { min: 5, max: 99 })}
                  placeholder="99"
                  className="w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md tabular-nums focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </label>
            </div>

            {/* Join Mode Radio Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <label
                onClick={() => setValue('joinMode', 'open')}
                className={`p-4 rounded-md border-2 transition-all cursor-pointer flex items-start gap-3 ${
                  watchedValues.joinMode === 'open'
                    ? 'border-primary bg-light-surface-elevated dark:bg-dark-surface-elevated'
                    : 'border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background'
                }`}
              >
                <input
                  type="radio"
                  value="open"
                  {...register('joinMode')}
                  className="mt-1 text-primary focus:ring-primary"
                />
                <div>
                  <p className="font-label text-label-lg font-semibold">Open Join</p>
                  <p className="font-body text-body-sm text-light-muted dark:text-dark-muted mt-0.5">
                    Players join immediately while slots are available. Perfect for quick pickups.
                  </p>
                </div>
              </label>

              <label
                onClick={() => setValue('joinMode', 'approval')}
                className={`p-4 rounded-md border-2 transition-all cursor-pointer flex items-start gap-3 ${
                  watchedValues.joinMode === 'approval'
                    ? 'border-primary bg-light-surface-elevated dark:bg-dark-surface-elevated'
                    : 'border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background'
                }`}
              >
                <input
                  type="radio"
                  value="approval"
                  {...register('joinMode')}
                  className="mt-1 text-primary focus:ring-primary"
                />
                <div>
                  <p className="font-label text-label-lg font-semibold">Approval Required</p>
                  <p className="font-body text-body-sm text-light-muted dark:text-dark-muted mt-0.5">
                    Review player applications before confirming slots. Maintain skill and balance.
                  </p>
                </div>
              </label>
            </div>
          </section>

          {/* Section 4: Equipment Requirements */}
          <section className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-headline text-title-lg font-bold">4. Equipment Requirements</h2>
                <p className="font-body text-body-sm text-light-muted dark:text-dark-muted">
                  Players can pledge to bring these items upon joining
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddEquip(!showAddEquip)}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border font-label text-label-md hover:border-primary transition-colors"
              >
                <FontAwesomeIcon icon={faPlus} className="text-xs" />
                <span>Add Item</span>
              </button>
            </div>

            {/* Inline Add Equipment Box */}
            {showAddEquip && (
              <div className="p-4 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-primary/40 flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="text"
                  placeholder="Item name (e.g. Size 5 Football, Bibs)"
                  value={newEquipName}
                  onChange={(e) => setNewEquipName(e.target.value)}
                  className="flex-1 w-full px-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md focus:border-primary focus:outline-none"
                />
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={newEquipQty}
                  onChange={(e) => setNewEquipQty(e.target.value)}
                  className="w-24 px-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md tabular-nums focus:border-primary focus:outline-none"
                />
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleAddEquipment}
                    className="flex-1 sm:flex-initial px-4 py-2 rounded-md bg-primary text-on-primary font-label text-label-md font-semibold hover:opacity-90"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddEquip(false)}
                    className="px-3 py-2 rounded-md bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border font-label text-label-md text-light-muted dark:text-dark-muted"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Equipment Items List */}
            <div className="flex flex-col gap-3">
              {equipmentList.length === 0 ? (
                <p className="font-body text-body-sm text-light-muted dark:text-dark-muted italic py-2">
                  No specific equipment requested. Organizer will supply all required gear.
                </p>
              ) : (
                equipmentList.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border flex items-center justify-between gap-4"
                  >
                    <span className="font-body text-body-md font-medium">{item.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="font-label text-label-md tabular-nums text-light-muted dark:text-dark-muted">
                        Qty: {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveEquipment(item.id)}
                        aria-label={`Remove ${item.name}`}
                        className="text-error hover:opacity-80 transition-opacity p-1"
                      >
                        <FontAwesomeIcon icon={faTrashCan} className="text-sm" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </form>

        {/* Live Match Preview (4 columns, Sticky Parity) */}
        <aside className="lg:col-span-4 lg:sticky lg:top-24 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="font-label text-label-sm uppercase tracking-wider text-light-muted dark:text-dark-muted">
              Live Player Preview
            </span>
            <span className="font-label text-xs text-primary font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Real-time
            </span>
          </div>

          {/* Interactive Preview Card (Parity with UIUX/create_quick_match/code.html lines 410-427) */}
          <article className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-5 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="px-2.5 py-1 rounded-full bg-light-surface-elevated dark:bg-dark-surface-elevated text-primary font-label text-label-sm font-semibold">
                {sportsCatalog.find((s) => s.id === watchedValues.sport)?.name || watchedValues.sport || 'Sports'}
              </span>
              <span
                className={`px-2.5 py-1 rounded-full font-label text-label-sm font-semibold ${
                  watchedValues.joinMode === 'open'
                    ? 'bg-success text-on-success'
                    : 'bg-warning text-on-warning'
                }`}
              >
                {watchedValues.joinMode === 'open' ? 'Open Join' : 'Approval Required'}
              </span>
            </div>

            <div>
              <h3 className="font-headline text-title-lg font-bold leading-tight">
                {watchedValues.title || 'Untitled Quick Match'}
              </h3>
              <p className="font-body text-body-sm text-light-muted dark:text-dark-muted mt-1.5 flex items-center gap-1.5">
                <FontAwesomeIcon icon={faLocationDot} className="text-xs text-secondary" />
                <span className="truncate">{watchedValues.venue || 'Dhaka Venue'}</span>
              </p>
            </div>

            <div className="flex flex-col gap-1.5 text-body-sm text-light-muted dark:text-dark-muted font-body">
              <span className="tabular-nums flex items-center gap-1.5">
                <FontAwesomeIcon icon={faClock} className="text-xs text-primary" />
                <span>
                  {watchedValues.date || 'Today'} • {watchedValues.startTime || '18:00'} ({watchedValues.duration || '90 mins'})
                </span>
              </span>
              <span className="tabular-nums flex items-center gap-1.5">
                <FontAwesomeIcon icon={faUsers} className="text-xs text-secondary" />
                <span>
                  1 / {watchedValues.maxPlayers || 4} players • {watchedValues.skillLevel || 'Intermediate'}
                </span>
              </span>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="px-2 py-0.5 rounded-full bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border text-[11px] font-label font-semibold">
                  {formatMatchGenderLabel(watchedValues.genderRestriction)}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border text-[11px] font-label font-semibold tabular-nums">
                  {formatMatchAgeLabel(watchedValues.minAge, watchedValues.maxAge)}
                </span>
              </div>
            </div>

            {watchedValues.turfFee && (
              <div className="px-3 py-2 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated text-xs font-label text-light-on-surface dark:text-dark-on-surface flex justify-between items-center">
                <span>Fee split:</span>
                <span className="font-mono text-primary font-semibold">{watchedValues.turfFee}</span>
              </div>
            )}

            <footer className="pt-3 border-t border-light-border dark:border-dark-border flex items-center justify-between">
              <span className="font-body text-body-sm text-light-muted dark:text-dark-muted">
                Org: {user?.name || user?.fullName || 'Organizer'}
              </span>
              <span className="px-4 py-2 rounded-md bg-primary text-on-primary font-label text-label-md font-semibold opacity-90 cursor-default">
                Join Match
              </span>
            </footer>
          </article>

          <p className="font-body text-body-sm text-light-muted dark:text-dark-muted leading-relaxed">
            Quick Matches go live immediately—no administrator approval required. Confirmed players receive instant notifications and automated match passes.
          </p>
        </aside>
      </div>
    </div>
  );
};

export default CreateQuickMatchPage;
