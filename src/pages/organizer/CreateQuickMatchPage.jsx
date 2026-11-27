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
import { toastService } from '../../components/feedback/toastService';
import { ROUTES } from '../../constants/routes';

export const CreateQuickMatchPage = ({ isEdit = false }) => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);

  // Dynamic equipment list
  const [equipmentList, setEquipmentList] = useState([
    { id: 'eq_1', name: 'Shuttlecock Tubes (Feather)', quantity: 2 },
  ]);
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
      title: 'Gazipur Evening Badminton Doubles',
      sport: 'Badminton',
      description: 'Friendly doubles session on Court 2. Non-marking shoes required; rotating partners every 2 sets.',
      date: new Date().toISOString().split('T')[0],
      startTime: '18:00',
      duration: '90 mins',
      venue: 'Gazipur Sadar Indoor Hall, Joydebpur Road',
      minPlayers: 2,
      maxPlayers: 4,
      skillLevel: 'Intermediate',
      joinMode: 'open', // 'open' | 'approval'
      turfFee: 'BDT 250',
    },
  });

  // Watch form fields for live preview
  const watchedValues = watch();

  // If edit mode, load existing match
  useEffect(() => {
    if (matchId || isEdit) {
      const targetId = matchId || 'match_1';
      setFetchLoading(true);
      matchService
        .getMatchById(targetId)
        .then((res) => {
          if (res?.data) {
            const m = res.data;
            reset({
              title: m.title || '',
              sport: m.sport || 'Football',
              description: m.description || '',
              date: m.date || new Date().toISOString().split('T')[0],
              startTime: m.time?.split(' - ')[0] || '18:00',
              duration: '90 mins',
              venue: m.venue || m.area || '',
              minPlayers: m.minPlayers || 2,
              maxPlayers: m.totalSlots || 10,
              skillLevel: m.skillLevel || 'Intermediate',
              joinMode: m.joinMode || 'open',
              turfFee: m.turfFee || 'BDT 250',
            });
            if (m.equipment && m.equipment.length > 0) {
              setEquipmentList(
                m.equipment.map((eq, i) => ({
                  id: eq.id || `eq_${i}`,
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
    const payload = {
      ...data,
      equipment: equipmentList,
      organizerName: user?.name || 'Tanvir Hasan',
      status: isDraft ? 'DRAFT' : 'ACTIVE',
      state: isDraft ? 'draft' : 'open',
    };

    try {
      if (matchId) {
        await matchService.updateMatch(matchId, payload);
        toastService.success('Match updated successfully!');
        navigate(`${ROUTES.ORGANIZER_MATCH_MANAGEMENT.replace(':matchId', matchId)}`);
      } else {
        const res = await matchService.createMatch(payload);
        toastService.success(isDraft ? 'Match saved as draft!' : 'Match published live!');
        if (res?.data?.id) {
          navigate(ROUTES.ORGANIZER_MATCHES);
        } else {
          navigate(ROUTES.ORGANIZER_MATCHES);
        }
      }
    } catch {
      toastService.error('An error occurred while saving the match.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Contextual Header */}
      <header className="sticky top-0 z-20 min-h-16 py-2 border-b border-light-border dark:border-dark-border bg-light-background/95 dark:bg-dark-background/95 backdrop-blur-md px-2 sm:px-4 flex flex-wrap items-center justify-between gap-4">
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
                  <option value="Badminton">Badminton</option>
                  <option value="Football">Football 7v7</option>
                  <option value="Cricket">Cricket (Tape-Ball)</option>
                  <option value="Basketball">Basketball 3x3</option>
                  <option value="Table Tennis">Table Tennis</option>
                  <option value="Volleyball">Volleyball</option>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <span className="font-label text-label-md">Turf Fee Split (Optional)</span>
                <input
                  type="text"
                  {...register('turfFee')}
                  placeholder="e.g. BDT 250 / player"
                  className="w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </label>
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
        <aside className="lg:col-span-4 sticky top-24 flex flex-col gap-4">
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
                {watchedValues.sport || 'Sports'}
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
            </div>

            {watchedValues.turfFee && (
              <div className="px-3 py-2 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated text-xs font-label text-light-on-surface dark:text-dark-on-surface flex justify-between items-center">
                <span>Fee split:</span>
                <span className="font-mono text-primary font-semibold">{watchedValues.turfFee}</span>
              </div>
            )}

            <footer className="pt-3 border-t border-light-border dark:border-dark-border flex items-center justify-between">
              <span className="font-body text-body-sm text-light-muted dark:text-dark-muted">
                Org: {user?.name || 'Tanvir Hasan'}
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
