import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBolt,
  faTableTennisPaddleBall,
  faShieldHalved,
  faMagnifyingGlassLocation,
  faUsersGear,
  faQrcode,
  faStar,
  faCircleCheck,
  faCompass,
  faPlus,
  faArrowRight,
  faLocationDot,
  faChild,
  faFileContract,
} from '@fortawesome/free-solid-svg-icons';
import { ROUTES } from '../../constants/routes';
import Button from '../../components/common/Button';

export const AboutUsPage = () => {
  return (
    <div className="flex flex-col gap-12 sm:gap-16 pb-12">
      {/* Mission & Vision Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 lg:pt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        <div className="lg:col-span-7 flex flex-col gap-5">
          <div className="inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border">
            <span className="w-2 h-2 rounded-full bg-primary" aria-hidden="true" />
            <span className="font-label text-xs sm:text-sm font-semibold text-light-on-surface dark:text-dark-on-surface">
              Built for Local Sports Communities in Bangladesh
            </span>
          </div>

          <h1 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight text-light-on-background dark:text-dark-on-background">
            Turning Empty Turfs and Solo Evenings Into Real Matches.
          </h1>

          <p className="font-body text-base sm:text-lg text-light-muted dark:text-dark-muted max-w-prose leading-relaxed">
            Khela Hobe exists to make recreational sport effortless across Bangladesh. Whether you are short two players for Friday futsal in Banani or looking for an evening badminton court in Uttara, we connect reliable teammates, shared gear, and verified local venues without endless group-chat chaos.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link to={ROUTES.EXPLORE_MATCHES}>
              <Button variant="primary" size="lg" icon={faCompass}>
                Explore Nearby Matches
              </Button>
            </Link>
            <Link to={ROUTES.CREATE_QUICK_MATCH}>
              <Button variant="secondary" size="lg" icon={faPlus}>
                Organize a Quick Match
              </Button>
            </Link>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="rounded-xl overflow-hidden border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface shadow-sm">
            <img
              src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80"
              alt="Players competing under floodlights at a Dhaka futsal turf"
              className="w-full h-64 sm:h-72 object-cover"
            />
            <div className="p-5 grid grid-cols-3 gap-4 border-t border-light-border dark:border-dark-border">
              <div>
                <p className="font-headline font-bold text-2xl tabular-nums text-primary">12+</p>
                <p className="font-body text-xs text-light-muted dark:text-dark-muted mt-0.5">Active sports</p>
              </div>
              <div>
                <p className="font-headline font-bold text-2xl tabular-nums text-light-on-surface dark:text-dark-on-surface">64</p>
                <p className="font-body text-xs text-light-muted dark:text-dark-muted mt-0.5">Districts supported</p>
              </div>
              <div>
                <p className="font-headline font-bold text-2xl tabular-nums text-success">98%</p>
                <p className="font-body text-xs text-light-muted dark:text-dark-muted mt-0.5">Match show-up</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Community Purpose */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 border-t border-light-border dark:border-dark-border w-full">
        <div className="mb-8 max-w-2xl">
          <span className="font-label text-xs uppercase tracking-wider font-semibold text-primary">
            Mission &amp; Community Purpose
          </span>
          <h2 className="font-headline font-bold text-2xl sm:text-3xl mt-1 text-light-on-background dark:text-dark-on-background">
            Why We Built Khela Hobe
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <article className="rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-6 flex flex-col gap-3">
            <span className="w-11 h-11 rounded-lg bg-light-surface-elevated dark:bg-dark-surface-elevated text-primary flex items-center justify-center">
              <FontAwesomeIcon icon={faBolt} className="text-xl" />
            </span>
            <h3 className="font-headline font-bold text-lg text-light-on-background dark:text-dark-on-background">
              Instant Quick Matches
            </h3>
            <p className="font-body text-sm text-light-muted dark:text-dark-muted leading-relaxed">
              Quick Matches publish immediately without waiting on administrative approval queues, so organizers can fill open slots the same afternoon.
            </p>
          </article>

          <article className="rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-6 flex flex-col gap-3">
            <span className="w-11 h-11 rounded-lg bg-light-surface-elevated dark:bg-dark-surface-elevated text-secondary flex items-center justify-center">
              <FontAwesomeIcon icon={faTableTennisPaddleBall} className="text-xl" />
            </span>
            <h3 className="font-headline font-bold text-lg text-light-on-background dark:text-dark-on-background">
              Shared Equipment Pledges
            </h3>
            <p className="font-body text-sm text-light-muted dark:text-dark-muted leading-relaxed">
              Every match tracks Required, Committed, and Remaining gear transparently, whether that is bibs, shuttlecock tubes, or match balls.
            </p>
          </article>

          <article className="rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-6 flex flex-col gap-3">
            <span className="w-11 h-11 rounded-lg bg-light-surface-elevated dark:bg-dark-surface-elevated text-accent flex items-center justify-center">
              <FontAwesomeIcon icon={faShieldHalved} className="text-xl" />
            </span>
            <h3 className="font-headline font-bold text-lg text-light-on-background dark:text-dark-on-background">
              Trusted Local Play
            </h3>
            <p className="font-body text-sm text-light-muted dark:text-dark-muted leading-relaxed">
              Clear skill levels, organizer rosters, and post-match moderation keep neighborhood turfs welcoming for beginners and competitive players alike.
            </p>
          </article>
        </div>
      </section>

      {/* How It Works Steps */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 py-6 border-t border-light-border dark:border-dark-border w-full">
        <div className="mb-8">
          <span className="font-label text-xs uppercase tracking-wider font-semibold text-primary">
            How It Works
          </span>
          <h2 className="font-headline font-bold text-2xl sm:text-3xl mt-1 text-light-on-background dark:text-dark-on-background">
            From Discovery to Kickoff in Four Steps
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold text-primary">STEP 01</span>
              <FontAwesomeIcon icon={faMagnifyingGlassLocation} className="text-light-muted dark:text-dark-muted text-sm" />
            </div>
            <h3 className="font-headline font-semibold text-base text-light-on-background dark:text-dark-on-background">
              Discover Nearby
            </h3>
            <p className="font-body text-sm text-light-muted dark:text-dark-muted leading-relaxed">
              Filter by sport, timing, distance, and skill bracket. See real-time slot availability.
            </p>
          </div>

          <div className="rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold text-primary">STEP 02</span>
              <FontAwesomeIcon icon={faUsersGear} className="text-light-muted dark:text-dark-muted text-sm" />
            </div>
            <h3 className="font-headline font-semibold text-base text-light-on-background dark:text-dark-on-background">
              Lock Roster or Pledge Gear
            </h3>
            <p className="font-body text-sm text-light-muted dark:text-dark-muted leading-relaxed">
              Join open matches directly or apply for curated rosters. Pledge essential gear like bibs or extra balls.
            </p>
          </div>

          <div className="rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold text-primary">STEP 03</span>
              <FontAwesomeIcon icon={faQrcode} className="text-light-muted dark:text-dark-muted text-sm" />
            </div>
            <h3 className="font-headline font-semibold text-base text-light-on-background dark:text-dark-on-background">
              Check In with Organizer
            </h3>
            <p className="font-body text-sm text-light-muted dark:text-dark-muted leading-relaxed">
              Arrive at the verified turf or court, present your digital match pass or ticket QR, and warm up.
            </p>
          </div>

          <div className="rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold text-primary">STEP 04</span>
              <FontAwesomeIcon icon={faStar} className="text-light-muted dark:text-dark-muted text-sm" />
            </div>
            <h3 className="font-headline font-semibold text-base text-light-on-background dark:text-dark-on-background">
              Review &amp; Rate Safety
            </h3>
            <p className="font-body text-sm text-light-muted dark:text-dark-muted leading-relaxed">
              Confirm attendance, rate sportsmanship, and help maintain community accountability across all matches.
            </p>
          </div>
        </div>
      </section>

      {/* Safety & Guardian Protection */}
      <section id="safety" className="max-w-7xl mx-auto px-4 sm:px-6 py-6 border-t border-light-border dark:border-dark-border w-full">
        <div className="rounded-2xl bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 flex flex-col gap-3">
            <div className="inline-flex items-center gap-2 self-start px-2.5 py-1 rounded-md bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border">
              <FontAwesomeIcon icon={faChild} className="text-primary text-xs" />
              <span className="font-label text-xs font-semibold text-light-on-surface dark:text-dark-on-surface">
                Guardian Oversight
              </span>
            </div>
            <h2 className="font-headline font-bold text-2xl sm:text-3xl text-light-on-background dark:text-dark-on-background">
              Designed with Young Athletes &amp; Families in Mind
            </h2>
            <p className="font-body text-sm sm:text-base text-light-muted dark:text-dark-muted leading-relaxed">
              Younger players can link their profile to a guardian account. Guardians receive instant match check-in alerts, emergency contact routing, organizer verification details, and can configure safety boundaries before their child steps on the pitch.
            </p>
          </div>
          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3">
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border">
              <FontAwesomeIcon icon={faCircleCheck} className="text-success text-base shrink-0" />
              <span className="font-body text-xs sm:text-sm text-light-on-surface dark:text-dark-on-surface font-medium">
                Verified organizers and check-in confirmation
              </span>
            </div>
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border">
              <FontAwesomeIcon icon={faCircleCheck} className="text-success text-base shrink-0" />
              <span className="font-body text-xs sm:text-sm text-light-on-surface dark:text-dark-on-surface font-medium">
                Real-time arrival and departure notifications
              </span>
            </div>
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border">
              <FontAwesomeIcon icon={faCircleCheck} className="text-success text-base shrink-0" />
              <span className="font-body text-xs sm:text-sm text-light-on-surface dark:text-dark-on-surface font-medium">
                Independent child approval requirement for safety links
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full">
        <div className="rounded-2xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-8 sm:p-12 text-center flex flex-col items-center gap-5">
          <span className="font-label text-xs uppercase tracking-wider font-semibold text-primary">
            Ready to Play?
          </span>
          <h2 className="font-headline font-extrabold text-2xl sm:text-3xl lg:text-4xl text-light-on-background dark:text-dark-on-background max-w-2xl">
            Find Your Match or Rally Your Neighborhood Today.
          </h2>
          <p className="font-body text-sm sm:text-base text-light-muted dark:text-dark-muted max-w-xl">
            Join thousands of recreational players across Dhaka, Chattogram, Sylhet, and beyond. Free to join, instant match organization.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link to={ROUTES.EXPLORE_MATCHES}>
              <Button variant="primary" size="lg" icon={faArrowRight} iconPosition="right">
                Explore Matches
              </Button>
            </Link>
            <Link to={ROUTES.REGISTER}>
              <Button variant="secondary" size="lg">
                Create Free Account
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUsPage;
