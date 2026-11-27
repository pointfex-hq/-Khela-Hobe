import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFutbol,
  faBolt,
  faShieldHalved,
  faShieldHeart,
  faUsers,
  faLocationDot,
  faCalendarCheck,
  faCheck,
  faChevronDown,
  faArrowRight,
  faHandshakeAngle,
  faClock,
  faPlus,
  faCompass,
  faMobileScreenButton,
  faCircleCheck,
  faQrcode,
  faStar,
} from '@fortawesome/free-solid-svg-icons';

import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import SportCard from '../../components/cards/SportCard';
import TaglineReveal from '../../components/common/TaglineReveal';
import Modal from '../../components/modals/Modal';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import showToast from '../../components/feedback/toastService';

import { useAuth } from '../../hooks/useAuth';
import { landingService } from '../../services/endpoints/landingService';
import { SPORTS } from '../../constants/sports';
import { ROUTES } from '../../constants/routes';
import { formatCurrencyBDT } from '../../utils/formatters';
import heroFutsalImg from '../../assets/images/futsal_night.jpg';

export const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const isAuth = typeof isAuthenticated === 'function' ? isAuthenticated() : Boolean(isAuthenticated);

  // Data states from repository abstraction
  const [heroStats, setHeroStats] = useState([]);
  const [featuredMatches, setFeaturedMatches] = useState([]);
  const [communityBenefits, setCommunityBenefits] = useState([]);
  const [organizerBenefits, setOrganizerBenefits] = useState([]);
  const [loading, setLoading] = useState(true);

  // Interactive UI states
  const [selectedSport, setSelectedSport] = useState('all');
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [reservingMatch, setReservingMatch] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadLandingData = async () => {
      setLoading(true);
      try {
        const [statsRes, matchesRes, benefitsRes] = await Promise.all([
          landingService.getHeroStats(),
          landingService.getFeaturedMatches(),
          landingService.getBenefits(),
        ]);
        setHeroStats(statsRes.data || []);
        setFeaturedMatches(matchesRes.data || []);
        setCommunityBenefits(benefitsRes.community || []);
        setOrganizerBenefits(benefitsRes.organizer || []);
      } catch (err) {
        console.warn('Failed to fetch live landing data, using local repository fallback', err);
      } finally {
        setLoading(false);
      }
    };
    loadLandingData();
  }, []);

  // CTA navigation handler for Create/Organize Match
  const handleOrganizeMatchClick = () => {
    if (isAuth) {
      navigate(ROUTES.CREATE_QUICK_MATCH);
    } else {
      navigate(ROUTES.LOGIN, {
        state: { from: { pathname: ROUTES.CREATE_QUICK_MATCH } },
      });
    }
  };

  const handleSportCardClick = (sportId) => {
    setSelectedSport(selectedSport === sportId ? 'all' : sportId);
  };

  const toggleFaq = (index) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  const handleJoinMatch = async () => {
    if (!reservingMatch) return;
    setIsSubmitting(true);
    try {
      await landingService.joinFeaturedMatch(reservingMatch.id);
      showToast.success(`Reserved 1 slot for ${reservingMatch.title}`);
      setFeaturedMatches((prev) =>
        prev.map((m) =>
          m.id === reservingMatch.id
            ? { ...m, filledSlots: Math.min(m.totalSlots, m.filledSlots + 1) }
            : m
        )
      );
      setReservingMatch(null);
    } catch (err) {
      showToast.error('Unable to reserve slot. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter matches based on selected category
  const filteredMatches =
    selectedSport === 'all'
      ? featuredMatches
      : featuredMatches.filter(
          (m) =>
            m.sport.toLowerCase().includes(selectedSport.toLowerCase()) ||
            m.sportCategory?.toLowerCase().includes(selectedSport.toLowerCase())
        );

  const faqs = [
    {
      q: 'How does Khela Hobe work for individual players?',
      a: 'Browse active matches by sport, location, and start time across Dhaka and neighboring areas. When you see an open match with available slots, reserve your place instantly. You receive venue details, teammate rosters, and equipment checklists on your confirmation ticket.',
    },
    {
      q: 'Can anyone organize a match or do I need special certification?',
      a: 'Any registered player can publish a Quick Match in two minutes. You set the venue, timing, capacity cap, and participation mode. You can choose open join for instant entry or review mode to approve applicant requests manually.',
    },
    {
      q: 'Is there any fee to sign up and discover matches?',
      a: 'Joining Khela Hobe and browsing nearby games is completely free. When an organizer rents a private turf or floodlit court, the venue split fee is clearly listed upfront with zero hidden platform charges.',
    },
    {
      q: 'How do equipment pledges work before game time?',
      a: 'Organizers specify what items the venue provides and what extra gear is needed. When joining, players can pledge to bring match balls, extra bats, or vests. The system tracks pledges so squads never show up short of equipment.',
    },
    {
      q: 'How does the platform protect younger players and teenagers?',
      a: 'Parents and guardians can create linked accounts to supervise minor participants. Guardians view match venue locations, monitor check in status, and receive alerts whenever safety settings require verified adult attendance.',
    },
    {
      q: 'What happens if a match is cancelled due to weather or turf issues?',
      a: 'Organizers can update match status instantly through their dashboard. All confirmed participants receive automated SMS and inbox notifications with cancellation details and rescheduling options.',
    },
  ];

  return (
    <div className="flex flex-col gap-16 sm:gap-24">
      {/* ========================================================================= */}
      {/* 5. HERO SECTION & 6, 7. PRIMARY/SECONDARY CTAS */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-14 pb-4 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Live indicator badge */}
          <div className="inline-flex items-center gap-2.5 self-start px-3.5 py-1.5 rounded-full bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border shadow-sm">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" aria-hidden="true" />
            <span className="font-label text-xs sm:text-sm font-semibold text-light-on-surface dark:text-dark-on-surface">
              Live across Dhaka, Gazipur, Narayanganj and Chattogram
            </span>
          </div>

          {/* Heading with left to right text gradient per skill B5 */}
          <h1 className="heading-2 sm:heading-1 font-headline font-bold text-balance max-w-[680px] tracking-tight">
            <span className="bg-gradient-to-r from-black via-zinc-800 to-zinc-500 dark:from-white dark:via-zinc-200 dark:to-[#9B9B9B] bg-clip-text text-transparent">
              Find your game. Build your squad. Play tonight.
            </span>
          </h1>

          {/* Subheading */}
          <p className="body-2 sm:body-1 text-light-muted dark:text-dark-muted max-w-[620px] text-pretty">
            Discover nearby football, badminton, cricket, and basketball matches in Bangladesh.
            Publish an instant Quick Match in two minutes and fill your squad without waiting for club approvals.
          </p>

          {/* CTAs: 6. Primary CTA (Find a Match) & 7. Secondary CTA (Organize a Match) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
            <Link to={ROUTES.EXPLORE_MATCHES} className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                icon={faCompass}
                className="w-full text-base font-bold shadow-md"
              >
                Find a Match
              </Button>
            </Link>

            <Button
              variant="secondary"
              size="lg"
              icon={faPlus}
              onClick={handleOrganizeMatchClick}
              className="w-full sm:w-auto text-base font-bold"
            >
              Organize a Match
            </Button>
          </div>

          {/* Hero Metrics Strip */}
          <div className="pt-6 border-t border-light-border dark:border-dark-border grid grid-cols-3 gap-6 max-w-md">
            {heroStats.map((stat, idx) => (
              <div key={idx} className="flex flex-col gap-1">
                <span
                  className={`font-headline text-2xl font-bold tabular-nums ${
                    stat.isHighlight
                      ? 'text-primary'
                      : 'text-light-on-background dark:text-dark-on-background'
                  }`}
                >
                  {stat.value}
                </span>
                <span className="font-body text-xs text-light-muted dark:text-dark-muted">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Hero Visual Card with Live Badge */}
        <div className="lg:col-span-5">
          <div className="relative rounded-xl overflow-hidden border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface shadow-xl">
            <div className="relative h-72 sm:h-96 w-full">
              <img
                src={heroFutsalImg}
                alt="Players competing on a floodlit artificial turf in Banani Dhaka"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-background via-transparent to-transparent opacity-80" />
              <div className="absolute top-4 left-4">
                <Badge variant="primary" size="md" hasDot>
                  Banani Turf Live
                </Badge>
              </div>
            </div>

            <div className="p-5 bg-light-surface dark:bg-dark-surface border-t border-light-border dark:border-dark-border flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated text-primary flex items-center justify-center border border-light-border dark:border-dark-border">
                  <FontAwesomeIcon icon={faBolt} className="text-base" />
                </span>
                <div>
                  <p className="font-title text-sm font-bold text-light-on-surface dark:text-dark-on-surface">
                    Banani Floodlit 7v7 Tonight
                  </p>
                  <p className="font-body text-xs text-light-muted dark:text-dark-muted tabular-nums">
                    8:30 PM • 2 slots left • Open Join
                  </p>
                </div>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setReservingMatch(featuredMatches.find((m) => m.id === 'match_banani_7v7') || featuredMatches[0])}
              >
                Join
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. FEATURED SPORTS CATEGORIES */}
      {/* ========================================================================= */}
      <section id="sports" className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="heading-4 sm:heading-3 font-headline font-bold text-light-on-background dark:text-dark-on-background">
              Popular sports across Bangladesh
            </h2>
            <p className="body-4 text-light-muted dark:text-dark-muted mt-1 max-w-xl">
              Jump into local weekend leagues, evening badminton courts, or neighborhood tape ball cricket runs.
            </p>
          </div>
          <Link to={ROUTES.EXPLORE_MATCHES}>
            <Button variant="outline" size="sm" icon={faArrowRight} iconPosition="right">
              View All Matches
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
          {SPORTS.map((sport) => (
            <SportCard
              key={sport.id}
              sport={sport}
              isSelected={selectedSport === sport.id}
              onSelect={handleSportCardClick}
            />
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* MANDATORY TAGLINE REVEAL MOMENT (Skill B11) */}
      {/* ========================================================================= */}
      <TaglineReveal
        text="Every neighborhood in Bangladesh has a pitch waiting for tonight. Find your team and claim your game."
        className="my-4 border-y border-light-border dark:border-dark-border bg-light-surface/40 dark:bg-dark-surface/40"
      />

      {/* ========================================================================= */}
      {/* 10. NEARBY MATCH DISCOVERY PREVIEW & 11. FEATURED MATCHES */}
      {/* ========================================================================= */}
      <section id="upcoming" className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-success" />
              <span className="font-label text-xs font-semibold text-success uppercase tracking-wider">
                Real Time Discovery
              </span>
            </div>
            <h2 className="heading-4 sm:heading-3 font-headline font-bold text-light-on-background dark:text-dark-on-background">
              Featured upcoming matches
            </h2>
            <p className="body-4 text-light-muted dark:text-dark-muted mt-1">
              Real time open slots near you ready to join right now.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedSport('all')}
              className={`px-3 py-1.5 rounded-full font-label text-xs font-semibold transition-colors ${
                selectedSport === 'all'
                  ? 'bg-primary text-on-primary'
                  : 'bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted'
              }`}
            >
              All Matches
            </button>
            <Link to={ROUTES.EXPLORE_MATCHES}>
              <Button variant="tertiary" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <LoadingSpinner size="lg" label="Loading featured games" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {filteredMatches.map((m) => {
              const isApproval = m.joinMode === 'Approval Required';
              const slotsLeft = Math.max(0, m.totalSlots - m.filledSlots);
              return (
                <article
                  key={m.id}
                  className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border overflow-hidden flex flex-col justify-between transition-state hover:border-primary group"
                >
                  <div>
                    <div className="relative h-44 w-full bg-light-surface-elevated dark:bg-dark-surface-elevated overflow-hidden">
                      <img
                        src={m.image}
                        alt={m.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full bg-dark-background/80 backdrop-blur-sm text-primary font-label text-xs font-semibold border border-dark-border">
                          {m.sport}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3">
                        <span
                          className={`px-2.5 py-1 rounded-full font-label text-xs font-semibold ${
                            isApproval
                              ? 'bg-warning text-on-warning'
                              : 'bg-success text-on-success'
                          }`}
                        >
                          {m.joinMode}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 flex flex-col gap-2">
                      <h3 className="font-headline text-lg font-bold text-light-on-surface dark:text-dark-on-surface leading-snug">
                        {m.title}
                      </h3>
                      <p className="font-body text-xs text-light-muted dark:text-dark-muted tabular-nums">
                        {m.area} • {m.schedule}
                      </p>
                      <p className="font-body text-xs text-light-muted dark:text-dark-muted tabular-nums mt-1">
                        {m.filledSlots} / {m.totalSlots} players • {m.skillLevel}
                      </p>
                    </div>
                  </div>

                  <footer className="px-5 py-4 border-t border-light-border dark:border-dark-border flex items-center justify-between gap-2 mt-2">
                    <span className="font-body text-xs text-light-muted dark:text-dark-muted truncate">
                      Org: {m.organizerName}
                    </span>
                    <Button
                      variant={isApproval ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={() => setReservingMatch(m)}
                    >
                      {isApproval ? 'Apply' : 'Join Match'}
                    </Button>
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 9. HOW KHELA HOBE WORKS & 14. SAFETY AND TRUST */}
      {/* ========================================================================= */}
      <section
        id="how-it-works"
        className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch"
      >
        {/* How It Works Card */}
        <div className="lg:col-span-7 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-8 flex flex-col gap-6">
          <h2 className="heading-4 font-headline font-bold text-light-on-surface dark:text-dark-on-surface">
            How Khela Hobe Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex flex-col gap-2">
              <span className="w-10 h-10 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated text-primary flex items-center justify-center">
                <FontAwesomeIcon icon={faLocationDot} className="text-lg" />
              </span>
              <h3 className="font-headline text-base font-bold text-light-on-surface dark:text-dark-on-surface">
                Discover Nearby
              </h3>
              <p className="font-body text-xs text-light-muted dark:text-dark-muted">
                Filter by sport, skill level, and area across Dhaka, Gazipur, and Chattogram.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <span className="w-10 h-10 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated text-primary flex items-center justify-center">
                <FontAwesomeIcon icon={faUsers} className="text-lg" />
              </span>
              <h3 className="font-headline text-base font-bold text-light-on-surface dark:text-dark-on-surface">
                Join or Pledge Gear
              </h3>
              <p className="font-body text-xs text-light-muted dark:text-dark-muted">
                Claim an open slot instantly and pledge shared gear like balls or shuttlecocks.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <span className="w-10 h-10 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated text-primary flex items-center justify-center">
                <FontAwesomeIcon icon={faBolt} className="text-lg" />
              </span>
              <h3 className="font-headline text-base font-bold text-light-on-surface dark:text-dark-on-surface">
                Show Up and Play
              </h3>
              <p className="font-body text-xs text-light-muted dark:text-dark-muted">
                Organize your own Quick Match anytime with zero admin approval delays.
              </p>
            </div>
          </div>
        </div>

        {/* Safety & Trust Card */}
        <div
          id="safety"
          className="lg:col-span-5 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-8 flex flex-col justify-between gap-4"
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-primary font-label text-sm font-semibold">
              <FontAwesomeIcon icon={faShieldHalved} className="text-base" />
              <span>Community and Guardian Safety</span>
            </div>
            <h2 className="heading-4 font-headline font-bold text-light-on-surface dark:text-dark-on-surface">
              Built for Trust on Every Pitch
            </h2>
            <p className="font-body text-sm text-light-muted dark:text-dark-muted leading-relaxed">
              Exact residential coordinates are never exposed publicly. Verified Guardian linking keeps youth athletes safe with explicit permission controls and instant safety alerts.
            </p>
          </div>

          <Button
            variant="tertiary"
            size="md"
            className="self-start"
            onClick={() => showToast.info('Safety documentation will be available in the upcoming release.')}
          >
            Read Safety Principles
          </Button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 12. COMMUNITY BENEFITS & 13. ORGANIZER BENEFITS */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="secondary" size="md" className="mb-3">
            Two Sided Sports Ecosystem
          </Badge>
          <h2 className="heading-4 sm:heading-3 font-headline font-bold text-balance text-light-on-background dark:text-dark-on-background">
            Designed for passionate players and reliable organizers
          </h2>
          <p className="body-4 text-light-muted dark:text-dark-muted mt-2">
            Whether you want to play a quick weekend match or run a premier tournament, Khela Hobe removes the friction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Player / Community Benefits */}
          <div className="p-8 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-md bg-primary text-on-primary flex items-center justify-center font-bold">
                <FontAwesomeIcon icon={faFutbol} className="text-base" />
              </span>
              <h3 className="title-1 font-headline font-bold text-light-on-surface dark:text-dark-on-surface">
                For Players & Communities
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {communityBenefits.map((item, idx) => (
                <div key={idx} className="flex flex-col gap-1.5 p-3 rounded-lg bg-light-surface-elevated dark:bg-dark-surface-elevated">
                  <span className="font-title text-sm font-bold text-light-on-surface dark:text-dark-on-surface">
                    {item.title}
                  </span>
                  <p className="font-body text-xs text-light-muted dark:text-dark-muted">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Organizer Benefits */}
          <div className="p-8 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-md bg-secondary text-on-secondary flex items-center justify-center font-bold">
                <FontAwesomeIcon icon={faCalendarCheck} className="text-base" />
              </span>
              <h3 className="title-1 font-headline font-bold text-light-on-surface dark:text-dark-on-surface">
                For Match Organizers
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {organizerBenefits.map((item, idx) => (
                <div key={idx} className="flex flex-col gap-1.5 p-3 rounded-lg bg-light-surface-elevated dark:bg-dark-surface-elevated">
                  <span className="font-title text-sm font-bold text-light-on-surface dark:text-dark-on-surface">
                    {item.title}
                  </span>
                  <p className="font-body text-xs text-light-muted dark:text-dark-muted">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 15. MOBILE PLATFORM PROMOTION SECTION */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <div className="p-8 sm:p-12 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-8 flex flex-col gap-4">
            <div className="inline-flex items-center gap-2 text-primary text-xs font-semibold font-label">
              <FontAwesomeIcon icon={faMobileScreenButton} className="text-base" />
              <span>Optimized Mobile Web Experience</span>
            </div>
            <h2 className="heading-4 font-headline font-bold text-light-on-surface dark:text-dark-on-surface">
              Carry your turf roster directly in your pocket
            </h2>
            <p className="body-4 text-light-muted dark:text-dark-muted max-w-xl">
              No heavy app store installation required. Khela Hobe runs instantly in your mobile browser with lightweight offline caching, automated SMS match reminders, and instant digital check in codes.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <div className="flex items-center gap-2 text-xs font-label text-light-on-surface dark:text-dark-on-surface">
                <FontAwesomeIcon icon={faCheck} className="text-primary text-xs" />
                <span>Runs fast on 4G across Bangladesh</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-label text-light-on-surface dark:text-dark-on-surface">
                <FontAwesomeIcon icon={faCheck} className="text-primary text-xs" />
                <span>Zero download required</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-4 flex justify-center">
            <div className="p-6 rounded-xl bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border text-center flex flex-col items-center gap-3">
              <FontAwesomeIcon icon={faQrcode} className="text-5xl text-primary" />
              <span className="font-label text-xs font-semibold text-light-on-surface dark:text-dark-on-surface">
                Scan to Open on Phone
              </span>
              <span className="font-mono text-[11px] text-light-muted dark:text-dark-muted">
                khelahobe.bd
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FAQ SECTION */}
      {/* ========================================================================= */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 w-full">
        <div className="text-center mb-10">
          <Badge variant="primary" size="md" className="mb-2">
            Questions Answered
          </Badge>
          <h2 className="heading-4 sm:heading-3 font-headline font-bold text-light-on-background dark:text-dark-on-background">
            Frequently asked questions
          </h2>
          <p className="body-4 text-light-muted dark:text-dark-muted mt-1">
            Everything you need to know about joining and hosting matches on Khela Hobe.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-expanded={isOpen}
                >
                  <span className="title-2 font-headline font-bold text-light-on-surface dark:text-dark-on-surface">
                    {faq.q}
                  </span>
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className={`text-sm text-light-muted dark:text-dark-muted transition-transform duration-300 ${
                      isOpen ? 'rotate-180 text-primary' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-light-muted dark:text-dark-muted font-body text-sm border-t border-light-border/40 dark:border-dark-border/40">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 16. FINAL CTA SECTION */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 w-full pb-8">
        <div className="p-8 sm:p-16 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-center flex flex-col items-center gap-6 relative overflow-hidden shadow-2xl">
          <span className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center text-2xl border border-primary/30">
            <FontAwesomeIcon icon={faFutbol} />
          </span>

          <h2 className="heading-3 sm:heading-2 font-headline font-bold text-balance max-w-xl text-light-on-surface dark:text-dark-on-surface">
            Ready to get back on the pitch tonight?
          </h2>

          <p className="body-2 text-light-muted dark:text-dark-muted max-w-lg text-pretty">
            Create your account in thirty seconds. Discover matches across Dhaka, invite friends, and play without bureaucracy.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link to={ROUTES.REGISTER}>
              <Button variant="primary" size="lg" icon={faArrowRight} iconPosition="right" className="font-bold">
                Get Started Free
              </Button>
            </Link>
            <Link to={ROUTES.EXPLORE_MATCHES}>
              <Button variant="tertiary" size="lg">
                Browse Active Games
              </Button>
            </Link>
          </div>

          <p className="font-body text-xs text-light-muted dark:text-dark-muted mt-2">
            No credit card needed. Free player account forever. Asia/Dhaka schedule.
          </p>
        </div>
      </section>

      {/* Quick Match Reservation Modal */}
      <Modal
        isOpen={Boolean(reservingMatch)}
        onClose={() => setReservingMatch(null)}
        title="Reserve Match Slot"
      >
        {reservingMatch && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <Badge variant="primary" size="sm">
                {reservingMatch.sport}
              </Badge>
              <span className="font-headline text-base font-bold text-primary tabular-nums">
                {formatCurrencyBDT(reservingMatch.fee)}
              </span>
            </div>

            <h3 className="font-headline text-lg font-bold text-light-on-surface dark:text-dark-on-surface">
              {reservingMatch.title}
            </h3>

            <div className="p-3.5 rounded-lg bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border text-xs flex flex-col gap-1.5 font-body">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faLocationDot} className="text-primary text-xs" />
                <span>{reservingMatch.venue || reservingMatch.area}</span>
              </div>
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faClock} className="text-primary text-xs" />
                <span className="tabular-nums">{reservingMatch.schedule}</span>
              </div>
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faUsers} className="text-primary text-xs" />
                <span className="tabular-nums">
                  {reservingMatch.filledSlots} / {reservingMatch.totalSlots} players confirmed
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-light-border dark:border-dark-border">
              <Button
                variant="tertiary"
                size="sm"
                onClick={() => setReservingMatch(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
                onClick={handleJoinMatch}
              >
                Confirm Reservation
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LandingPage;
