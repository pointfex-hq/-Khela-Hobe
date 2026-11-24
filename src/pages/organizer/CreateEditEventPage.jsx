import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faFloppyDisk,
  faPaperPlane,
  faTrophy,
  faLocationDot,
  faCalendarCheck,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { eventService } from '../../services/endpoints/eventService';
import { toastService } from '../../components/feedback/toastService';
import { ROUTES } from '../../constants/routes';

export const CreateEditEventPage = ({ isEdit = false }) => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: 'Dhaka Floodlit Futsal Cup 2026',
      sport: 'Football 7v7',
      format: 'Football 7v7 • Knockouts',
      venue: 'Banani Central Turf, Dhaka',
      area: 'Banani, Dhaka',
      date: '2026-11-28',
      time: '17:00',
      duration: '2 Days',
      totalTeams: 16,
      fee: 'BDT 3,000 / Team',
      description: '16-team weekend knockout tournament at Banani Central Turf. Includes certified referees, hydration stations, medical support, and live bracket updates.',
      image: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=800&auto=format&fit=crop&q=80',
    },
  });

  useEffect(() => {
    if (eventId || isEdit) {
      const targetId = eventId || 'evt_corp_cup';
      setFetching(true);
      eventService
        .getEventDetails(targetId)
        .then((res) => {
          if (res?.data) {
            const e = res.data;
            reset({
              title: e.title || '',
              sport: e.sport || 'Football 7v7',
              format: e.format || 'Knockouts',
              venue: e.venue || '',
              area: e.area || '',
              date: e.date || '',
              time: e.time || '17:00',
              duration: e.duration || '2 Days',
              totalTeams: e.totalTeams || 16,
              fee: e.fee || 'BDT 3,000 / Team',
              description: e.description || '',
              image: e.image || '',
            });
          }
        })
        .catch(() => {
          toastService.error('Failed to load event details.');
        })
        .finally(() => {
          setFetching(false);
        });
    }
  }, [eventId, isEdit, reset]);

  const onSubmit = async (formData) => {
    setLoading(true);
    try {
      if (eventId) {
        await eventService.updateEvent(eventId, formData);
        toastService.success('Event updated successfully!');
      } else {
        await eventService.createEvent(formData);
        toastService.success('Tournament event published live!');
      }
      navigate(ROUTES.ORGANIZER_EVENTS);
    } catch {
      toastService.error('Failed to save event.');
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
            aria-label="Back to Events"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
          </Link>
          <div>
            <h1 className="font-headline text-title-lg font-bold">
              {eventId ? 'Edit Tournament Event' : 'Create Tournament Event'}
            </h1>
            <p className="font-body text-body-sm text-light-muted dark:text-dark-muted">
              Configure teams, tournament format, rules, and venue reservation
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
          <span>{loading ? 'Saving...' : eventId ? 'Save Changes' : 'Publish Event'}</span>
        </button>
      </header>

      {/* Form Card */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <section className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-6 flex flex-col gap-5">
          <h2 className="font-headline text-title-md font-bold">Tournament Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5 md:col-span-2">
              <span className="font-label text-label-md font-semibold">Event Title</span>
              <input
                type="text"
                {...register('title', { required: 'Event title is required' })}
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
                <option value="Football 7v7">Football 7v7</option>
                <option value="Badminton">Badminton Doubles</option>
                <option value="Cricket">Cricket (Tape Ball)</option>
                <option value="Basketball 3x3">Basketball 3x3</option>
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="font-label text-label-md font-semibold">Format</span>
              <input
                type="text"
                {...register('format')}
                placeholder="e.g. Football 7v7 • Knockouts"
                className="w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md focus:border-primary focus:outline-none"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="font-label text-label-md font-semibold">Date</span>
              <input
                type="text"
                {...register('date', { required: 'Date is required' })}
                placeholder="e.g. 28–29 Nov 2026"
                className="w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md focus:border-primary focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="font-label text-label-md font-semibold">Start Time</span>
              <input
                type="text"
                {...register('time')}
                placeholder="e.g. 5:00 PM BST"
                className="w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md focus:border-primary focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="font-label text-label-md font-semibold">Duration</span>
              <input
                type="text"
                {...register('duration')}
                placeholder="e.g. 2 Days / 6 Hours"
                className="w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md focus:border-primary focus:outline-none"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="font-label text-label-md font-semibold">Venue &amp; Location</span>
              <input
                type="text"
                {...register('venue', { required: 'Venue is required' })}
                placeholder="e.g. Banani Central Turf, Dhaka"
                className="w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md focus:border-primary focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="font-label text-label-md font-semibold">Area / Thana</span>
              <input
                type="text"
                {...register('area')}
                placeholder="e.g. Banani, Dhaka"
                className="w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md focus:border-primary focus:outline-none"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="font-label text-label-md font-semibold">Total Teams / Slots</span>
              <input
                type="number"
                min="2"
                max="64"
                {...register('totalTeams')}
                className="w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md focus:border-primary focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="font-label text-label-md font-semibold">Registration Fee</span>
              <input
                type="text"
                {...register('fee')}
                placeholder="e.g. BDT 3,000 / Team"
                className="w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md focus:border-primary focus:outline-none"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="font-label text-label-md font-semibold">Description, Rules &amp; Amenities</span>
            <textarea
              rows={4}
              {...register('description')}
              placeholder="Detail tournament bracket system, referee qualifications, hydration, and prizes..."
              className="w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md focus:border-primary focus:outline-none resize-none"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-label text-label-md font-semibold">Banner Image URL</span>
            <input
              type="text"
              {...register('image')}
              placeholder="https://..."
              className="w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md focus:border-primary focus:outline-none"
            />
          </label>
        </section>

        <div className="flex items-center justify-end gap-3">
          <Link
            to={ROUTES.ORGANIZER_EVENTS}
            className="px-5 py-2.5 rounded-md bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border font-label text-label-md hover:border-primary transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-md bg-primary text-on-primary font-label text-label-md font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            <FontAwesomeIcon icon={faFloppyDisk} className="text-sm" />
            <span>{loading ? 'Saving...' : 'Save Tournament'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEditEventPage;
