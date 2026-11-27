import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faFloppyDisk,
  faPaperPlane,
  faTrophy,
  faUpload,
  faShieldHalved,
  faSquareCheck,
  faTicket,
  faCreditCard,
} from '@fortawesome/free-solid-svg-icons';
import { eventService } from '../../services/endpoints/eventService';
import { uploadService } from '../../services/endpoints/uploadService';
import { useAppStore } from '../../store/useAppStore';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../constants/roles';
import LocationPickerMap from '../../components/common/LocationPickerMap';
import { toastService } from '../../components/feedback/toastService';
import { ROUTES } from '../../constants/routes';

export const CreateEditEventPage = ({ isEdit = false }) => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const canPublish =
    role === ROLES.ADMIN || user?.organizerApprovalStatus === 'APPROVED';
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [bannerList, setBannerList] = useState([]);
  const [bannerUrlInput, setBannerUrlInput] = useState('');
  const [coords, setCoords] = useState({ lat: 23.7937, lng: 90.4066 });

  const sportsCatalog = useAppStore((s) => s.sports);
  const fetchSports = useAppStore((s) => s.fetchSports);
  const zones = useAppStore((s) => s.zones);
  const fetchLocations = useAppStore((s) => s.fetchLocations);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: '',
      sport: 'Football',
      format: 'Knockouts',
      venue: '',
      city: 'Dhaka',
      area: '',
      date: '',
      time: '17:00',
      duration: '2 Days',
      totalTeams: 16,
      teamSize: 7,
      entryFee: 0,
      paymentMode: 'OPTIONAL_VENUE',
      requireTeamApproval: true,
      spectatorMode: 'OPEN_FREE',
      spectatorCapacity: 100,
      ticketPrice: 100,
      vipTicketPrice: '',
      championPrize: '',
      runnerUpPrize: '',
      mvpPrize: '',
      prizePool: '',
      features: '',
      rules: '',
      description: '',
      image: '',
    },
  });

  useEffect(() => {
    fetchSports();
    fetchLocations();
  }, [fetchSports, fetchLocations]);

  useEffect(() => {
    if (eventId) {
      setFetching(true);
      eventService
        .getEventDetails(eventId)
        .then((res) => {
          if (res?.data) {
            const e = res.data;
            reset({
              title: e.title || '',
              sport: e.sport || 'Football',
              format: e.format || 'Knockouts',
              venue: e.venueName || e.venue || '',
              city: e.city || 'Dhaka',
              area: e.area || '',
              date: e.startDate || e.date || '',
              time: e.time || '17:00',
              duration: e.duration || '2 Days',
              totalTeams: e.maxTeams || e.totalTeams || 16,
              teamSize: e.teamSize || 7,
              entryFee: e.entryFee ?? 0,
              paymentMode: e.paymentMode || 'OPTIONAL_VENUE',
              requireTeamApproval: e.requireTeamApproval ?? true,
              spectatorMode: e.spectatorMode || 'OPEN_FREE',
              spectatorCapacity: e.spectatorCapacity ?? 100,
              ticketPrice: e.ticketPrice ?? 0,
              vipTicketPrice: e.vipTicketPrice ? String(e.vipTicketPrice) : '',
              championPrize: e.championPrize || '',
              runnerUpPrize: e.runnerUpPrize || '',
              mvpPrize: e.mvpPrize || '',
              prizePool: e.prizePool || '',
              features: e.features || '',
              rules: e.rules || '',
              description: e.description || '',
              image: e.coverImageUrl || e.image || '',
            });
            if (typeof e.latitude === 'number' && typeof e.longitude === 'number') {
              setCoords({ lat: e.latitude, lng: e.longitude });
            }
            const loadedBanners =
              Array.isArray(e.bannerImages) && e.bannerImages.length > 0
                ? e.bannerImages.slice(0, 4)
                : e.coverImageUrl || e.image
                  ? [e.coverImageUrl || e.image]
                  : [];
            setBannerList(loadedBanners);
          }
        })
        .catch(() => {
          toastService.error('Failed to load tournament details.');
        })
        .finally(() => {
          setFetching(false);
        });
    }
  }, [eventId, reset]);

  const handleBannerUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const slotsAvailable = Math.max(0, 4 - bannerList.length);
    if (slotsAvailable <= 0) {
      toastService.error('Maximum 4 tournament banner images allowed.');
      return;
    }
    setUploadingImage(true);
    try {
      const toUpload = files.slice(0, slotsAvailable);
      const uploadedUrls = [];
      for (const file of toUpload) {
        const res = await uploadService.uploadImage(file, 'tournaments');
        if (res?.url) uploadedUrls.push(res.url);
      }
      if (uploadedUrls.length > 0) {
        setBannerList((prev) => {
          const next = [...prev, ...uploadedUrls].slice(0, 4);
          setValue('image', next[0] || '');
          return next;
        });
        toastService.success(`Uploaded ${uploadedUrls.length} tournament banner image(s)!`);
      }
    } catch (err) {
      toastService.error(err?.message || 'Failed to upload image.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleAddBannerUrl = () => {
    const trimmed = bannerUrlInput.trim();
    if (!trimmed) return;
    if (bannerList.length >= 4) {
      toastService.error('Maximum 4 tournament banner images allowed.');
      return;
    }
    setBannerList((prev) => {
      const next = [...prev, trimmed].slice(0, 4);
      setValue('image', next[0] || '');
      return next;
    });
    setBannerUrlInput('');
  };

  const handleRemoveBanner = (idx) => {
    setBannerList((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      setValue('image', next[0] || '');
      return next;
    });
  };

  const onSubmit = async (formData) => {
    setLoading(true);
    try {
      const payload = {
        title: formData.title,
        sport: formData.sport,
        format: formData.format || 'Knockouts',
        venueName: formData.venue,
        city: formData.city || 'Dhaka',
        area: formData.area || formData.city || 'Dhaka',
        latitude: coords.lat,
        longitude: coords.lng,
        startDate: formData.date,
        time: formData.time || '17:00',
        duration: formData.duration || '2 Days',
        maxTeams: Number(formData.totalTeams) || 16,
        teamSize: Number(formData.teamSize) || 7,
        entryFee: formData.paymentMode === 'OPEN_FREE' ? 0 : Number(formData.entryFee) || 0,
        paymentMode: formData.paymentMode || 'OPTIONAL_VENUE',
        requireTeamApproval: Boolean(formData.requireTeamApproval),
        spectatorMode: formData.spectatorMode || 'OPEN_FREE',
        spectatorCapacity:
          formData.spectatorMode === 'LIMITED_TICKETS'
            ? Number(formData.spectatorCapacity) || 100
            : 0,
        ticketPrice:
          formData.spectatorMode === 'LIMITED_TICKETS'
            ? Number(formData.ticketPrice) || 0
            : 0,
        vipTicketPrice:
          formData.spectatorMode === 'LIMITED_TICKETS' && formData.vipTicketPrice
            ? Number(formData.vipTicketPrice)
            : null,
        championPrize: formData.championPrize || null,
        runnerUpPrize: formData.runnerUpPrize || null,
        mvpPrize: formData.mvpPrize || null,
        prizePool: formData.prizePool || null,
        features: formData.features || null,
        rules: formData.rules || null,
        description: formData.description,
        coverImageUrl: bannerList[0] || formData.image || null,
        bannerImages:
          bannerList.length > 0
            ? bannerList.slice(0, 4)
            : formData.image
              ? [formData.image]
              : [],
      };
      if (eventId) {
        await eventService.updateEvent(eventId, payload);
        toastService.success('Tournament updated successfully!');
      } else {
        await eventService.createEvent(payload);
        toastService.success('Tournament submitted for Admin moderation!');
      }
      navigate(ROUTES.ORGANIZER_EVENTS);
    } catch (err) {
      toastService.error(err?.message || 'Failed to save tournament.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl w-full mx-auto flex flex-col gap-6">
      {/* Header */}
      <header className="flex items-center justify-between gap-4 pb-2 border-b border-light-border dark:border-dark-border">
        <div className="flex items-center gap-3">
          <Link
            to={ROUTES.ORGANIZER_EVENTS}
            className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border hover:border-primary text-light-muted dark:text-dark-muted transition-colors"
            aria-label="Back to Tournaments"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
          </Link>
          <div>
            <h1 className="font-headline text-title-lg font-bold">
              {eventId ? 'Edit Tournament' : 'Create Tournament'}
            </h1>
            <p className="font-body text-body-sm text-light-muted dark:text-dark-muted">
              Configure prizes, squad sizes, rules, location pin, and submit for Admin approval
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit(onSubmit)}
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-md bg-primary text-on-primary font-label text-label-md font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity shadow-sm"
        >
          <FontAwesomeIcon icon={faPaperPlane} className="text-sm" />
          <span>{loading ? 'Submitting...' : eventId ? 'Save Changes' : 'Submit for Approval'}</span>
        </button>
      </header>

      <div className="rounded-lg bg-secondary/10 border border-secondary/30 p-3.5 flex items-center gap-3 text-xs text-light-on-surface dark:text-dark-on-surface">
        <FontAwesomeIcon icon={faShieldHalved} className="text-secondary text-base shrink-0" />
        <span>
          Tournaments require Admin moderation before becoming publicly open for team registrations.
        </span>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <section className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-6 flex flex-col gap-5">
          <h2 className="font-headline text-title-md font-bold">Tournament Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5 md:col-span-2">
              <span className="font-label text-label-md font-semibold">Tournament Title</span>
              <input
                type="text"
                {...register('title', { required: 'Tournament title is required' })}
                placeholder="e.g. Dhaka Corporate Futsal Cup 2026"
                className="w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md focus:border-primary focus:outline-none"
              />
              {errors.title && <span className="text-error text-xs">{errors.title.message}</span>}
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="font-label text-label-md font-semibold">Sport Category</span>
              <select
                {...register('sport')}
                className="w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md focus:border-primary focus:outline-none"
              >
                {sportsCatalog.length > 0 ? (
                  sportsCatalog.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))
                ) : (
                  <>
                    <option value="Football">Football</option>
                    <option value="Cricket">Cricket</option>
                    <option value="Badminton">Badminton</option>
                    <option value="Basketball">Basketball</option>
                  </>
                )}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="font-label text-label-md font-semibold">Format</span>
              <input
                type="text"
                {...register('format')}
                placeholder="e.g. 7v7 Knockouts + Group Stage"
                className="w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md focus:border-primary focus:outline-none"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="font-label text-label-md font-semibold">Start Date</span>
              <input
                type="date"
                {...register('date', { required: 'Date is required' })}
                className="w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md focus:border-primary focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="font-label text-label-md font-semibold">Kickoff Time</span>
              <input
                type="time"
                {...register('time')}
                className="w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md focus:border-primary focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="font-label text-label-md font-semibold">Duration</span>
              <input
                type="text"
                {...register('duration')}
                placeholder="e.g. 2 Days / Weekend"
                className="w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md focus:border-primary focus:outline-none"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="font-label text-label-md font-semibold">City / Division</span>
              <select
                {...register('city')}
                onChange={(e) => {
                  const chosen = e.target.value;
                  setValue('city', chosen);
                  const z = zones.find((item) => item.city === chosen);
                  if (z) {
                    setValue('area', z.area);
                    setCoords({ lat: z.latitude, lng: z.longitude });
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md focus:border-primary focus:outline-none"
              >
                {Array.from(new Set(['Dhaka', 'Chattogram', 'Sylhet', 'Rajshahi', 'Khulna', 'Barishal', 'Rangpur', 'Mymensingh', ...zones.map((z) => z.city)])).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="font-label text-label-md font-semibold">Zone / Area</span>
              <input
                type="text"
                {...register('area')}
                placeholder="e.g. Banani, GEC Circle"
                className="w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md focus:border-primary focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="font-label text-label-md font-semibold">Venue / Stadium / Turf Name</span>
              <input
                type="text"
                {...register('venue', { required: 'Venue is required' })}
                placeholder="e.g. Banani Central Turf"
                className="w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md focus:border-primary focus:outline-none"
              />
            </label>
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-label text-label-md font-semibold">Pin Venue on Map</span>
            <LocationPickerMap
              latitude={coords.lat}
              longitude={coords.lng}
              onChange={(lat, lng) => setCoords({ lat, lng })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="font-label text-label-md font-semibold">Max Teams</span>
              <input
                type="number"
                min="2"
                max="128"
                {...register('totalTeams')}
                className="w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md focus:border-primary focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="font-label text-label-md font-semibold">Players per Team</span>
              <input
                type="number"
                min="1"
                max="25"
                {...register('teamSize')}
                className="w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md focus:border-primary focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="font-label text-label-md font-semibold">Entry Fee (BDT / Team)</span>
              <input
                type="number"
                min="0"
                step="50"
                disabled={watch('paymentMode') === 'OPEN_FREE'}
                {...register('entryFee')}
                placeholder="0 for Free Entry"
                className="w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md focus:border-primary focus:outline-none disabled:opacity-50"
              />
            </label>
          </div>

          {/* Participation Payment Mode & Team Approval */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-light-border dark:border-dark-border">
            <label className="flex flex-col gap-1.5">
              <span className="font-label text-label-md font-semibold flex items-center gap-1.5">
                <FontAwesomeIcon icon={faCreditCard} className="text-primary text-xs" />
                <span>Participation Fee Settlement Mode</span>
              </span>
              <select
                {...register('paymentMode')}
                className="w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md focus:border-primary focus:outline-none"
              >
                <option value="OPEN_FREE">Free / Open for All Teams</option>
                <option value="OPTIONAL_VENUE">Optional (SSLCommerz Online OR Pay at Venue)</option>
                <option value="ONLINE_REQUIRED">Immediate Online Payment Required (SSLCommerz)</option>
              </select>
            </label>

            <label className="flex items-center gap-3 p-3.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border cursor-pointer self-end">
              <input
                type="checkbox"
                {...register('requireTeamApproval')}
                className="w-4 h-4 accent-primary"
              />
              <div>
                <span className="font-label text-xs font-bold block">Require Organizer Team Approval</span>
                <span className="font-body text-[11px] text-light-muted dark:text-dark-muted">
                  Review submitted team rosters &amp; Safety IDs before confirming their slot
                </span>
              </div>
            </label>
          </div>

          {/* Spectator / Visitor Ticketing Settings */}
          <div className="pt-2 border-t border-light-border dark:border-dark-border flex flex-col gap-3">
            <h3 className="font-headline text-sm font-bold flex items-center gap-2">
              <FontAwesomeIcon icon={faTicket} className="text-primary" />
              <span>Spectators &amp; Ticket Configuration</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <label className="flex flex-col gap-1 md:col-span-2">
                <span className="font-label text-xs font-semibold">Visitor Access</span>
                <select
                  {...register('spectatorMode')}
                  className="px-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border text-sm"
                >
                  <option value="OPEN_FREE">Open for All Spectators (Free Gate)</option>
                  <option value="LIMITED_TICKETS">Limited Spectator Seats (Ticketed)</option>
                  <option value="NONE">Players &amp; Officials Only (No Spectators)</option>
                </select>
              </label>

              {watch('spectatorMode') === 'LIMITED_TICKETS' && (
                <>
                  <label className="flex flex-col gap-1">
                    <span className="font-label text-xs font-semibold">Seat Capacity</span>
                    <input
                      type="number"
                      min="1"
                      max="50000"
                      {...register('spectatorCapacity')}
                      className="px-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border text-sm"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-label text-xs font-semibold">General Ticket (BDT)</span>
                    <input
                      type="number"
                      min="0"
                      {...register('ticketPrice')}
                      className="px-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border text-sm"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-label text-xs font-semibold">VIP Ticket (BDT, optional)</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="Optional"
                      {...register('vipTicketPrice')}
                      className="px-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border text-sm"
                    />
                  </label>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Prizes & Rewards Section */}
        <section className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-6 flex flex-col gap-4">
          <h2 className="font-headline text-title-md font-bold flex items-center gap-2">
            <FontAwesomeIcon icon={faTrophy} className="text-warning" />
            <span>Prizes &amp; Awards</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="font-label text-label-sm font-semibold">Champion Prize</span>
              <input
                type="text"
                {...register('championPrize')}
                placeholder="e.g. BDT 30,000 + Champion Trophy"
                className="w-full px-3.5 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border text-sm"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-label text-label-sm font-semibold">Runner-Up Prize</span>
              <input
                type="text"
                {...register('runnerUpPrize')}
                placeholder="e.g. BDT 15,000 + Silver Medals"
                className="w-full px-3.5 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border text-sm"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-label text-label-sm font-semibold">MVP / Best Player Award</span>
              <input
                type="text"
                {...register('mvpPrize')}
                placeholder="e.g. Golden Boot + Jersey Pack"
                className="w-full px-3.5 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border text-sm"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-label text-label-sm font-semibold">Total Prize Pool Summary</span>
              <input
                type="text"
                {...register('prizePool')}
                placeholder="e.g. BDT 50,000 Total Prize Pool"
                className="w-full px-3.5 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border text-sm"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <span className="font-label text-label-md font-semibold">
                Tournament Features (One line per feature)
              </span>
              <textarea
                rows={4}
                {...register('features')}
                placeholder={"Certified referees & official match balls\nHydration & first aid desk\nLive digital scorecards"}
                className="w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-sm focus:border-primary focus:outline-none resize-none"
              />
              {String(watch('features') || '').trim() && (
                <div className="p-3 rounded bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border flex flex-col gap-1.5">
                  {String(watch('features') || '')
                    .split('\n')
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .map((line, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <FontAwesomeIcon icon={faSquareCheck} className="text-primary mt-0.5 shrink-0" />
                        <span>{line}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-label text-label-md font-semibold">
                Rules &amp; Eligibility (One line per rule)
              </span>
              <textarea
                rows={4}
                {...register('rules')}
                placeholder={"Turf boots only (no metal studs)\nTeams must arrive 20 mins before kickoff\n20-minute halves with rolling subs"}
                className="w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-sm focus:border-primary focus:outline-none resize-none"
              />
              {String(watch('rules') || '').trim() && (
                <div className="p-3 rounded bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border flex flex-col gap-1.5">
                  {String(watch('rules') || '')
                    .split('\n')
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .map((line, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <FontAwesomeIcon icon={faSquareCheck} className="text-secondary mt-0.5 shrink-0" />
                        <span>{line}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="font-label text-label-md font-semibold">Tournament Description &amp; Amenities</span>
            <textarea
              rows={3}
              {...register('description', { required: 'Description is required' })}
              placeholder="Detail referee arrangements, drinking water, medical first aid, and match balls..."
              className="w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md focus:border-primary focus:outline-none resize-none"
            />
          </label>

          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-label text-label-md font-semibold">
                Banner Carousel Images (Optional, up to 4 images)
              </span>
              <span className="font-mono text-xs text-light-muted dark:text-dark-muted">
                {bannerList.length} / 4 added
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={bannerUrlInput}
                onChange={(e) => setBannerUrlInput(e.target.value)}
                placeholder="Paste image URL (https://...) and click + Add URL"
                className="flex-1 px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md focus:border-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddBannerUrl}
                disabled={bannerList.length >= 4 || !bannerUrlInput.trim()}
                className="px-4 py-2.5 rounded-md border border-primary text-primary font-label text-xs font-semibold hover:bg-primary/10 disabled:opacity-40"
              >
                + Add URL
              </button>
              <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border border-light-border dark:border-dark-border bg-light-surface-elevated dark:bg-dark-surface-elevated font-label text-xs font-semibold cursor-pointer hover:border-primary">
                <FontAwesomeIcon icon={faUpload} />
                <span>{uploadingImage ? 'Uploading...' : 'Upload (Max 4)'}</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  disabled={bannerList.length >= 4 || uploadingImage}
                  onChange={handleBannerUpload}
                />
              </label>
            </div>

            {bannerList.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                {bannerList.map((imgUrl, idx) => (
                  <div
                    key={`${imgUrl}-${idx}`}
                    className="relative rounded-md overflow-hidden border border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background"
                  >
                    <img src={imgUrl} alt={`Banner ${idx + 1}`} className="w-full h-24 object-cover" />
                    <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-dark-background/80 text-white font-mono text-[10px]">
                      {idx === 0 ? 'Primary' : `#${idx + 1}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveBanner(idx)}
                      className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-error text-white text-[10px] font-bold hover:opacity-90"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-end gap-3">
          {!canPublish && (
            <span className="text-xs font-semibold text-accent mr-auto">
              Admin approval required before publishing tournaments.
            </span>
          )}
          <Link
            to={ROUTES.ORGANIZER_EVENTS}
            className="px-5 py-2.5 rounded-md bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border font-label text-label-md hover:border-primary transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || !canPublish}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-md bg-primary text-on-primary font-label text-label-md font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            <FontAwesomeIcon icon={faFloppyDisk} className="text-sm" />
            <span>{loading ? 'Saving...' : eventId ? 'Save Changes' : 'Submit Tournament'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEditEventPage;
