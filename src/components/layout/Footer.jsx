import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFutbol, faShieldHalved, faLocationDot, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { faFacebookF, faInstagram, faYoutube, faLinkedinIn } from '@fortawesome/free-brands-svg-icons';
import { ROUTES } from '../../constants/routes';

export const Footer = () => {
  return (
    <footer className="mt-20 border-t border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
      <div className="max-w-7xl mx-auto px-6 py-12 lg:py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
        {/* Brand Column */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-md bg-primary text-on-primary flex items-center justify-center font-bold">
              <FontAwesomeIcon icon={faFutbol} className="text-sm" />
            </span>
            <span className="font-headline font-bold text-lg text-light-on-background dark:text-dark-on-background">
              Khela Hobe
            </span>
          </div>

          <p className="font-body text-sm text-light-muted dark:text-dark-muted max-w-sm">
            Community sports discovery and match coordination platform for Bangladesh.
            Connecting players with floodlit artificial pitches and indoor courts across Dhaka,
            Chattogram, and beyond.
          </p>

          <div className="flex items-center gap-3 mt-2 text-light-muted dark:text-dark-muted">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              className="w-8 h-8 rounded-md border border-light-border dark:border-dark-border flex items-center justify-center hover:text-primary hover:border-primary transition-colors"
            >
              <FontAwesomeIcon icon={faFacebookF} className="text-xs" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="w-8 h-8 rounded-md border border-light-border dark:border-dark-border flex items-center justify-center hover:text-primary hover:border-primary transition-colors"
            >
              <FontAwesomeIcon icon={faInstagram} className="text-xs" />
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noreferrer"
              aria-label="YouTube"
              className="w-8 h-8 rounded-md border border-light-border dark:border-dark-border flex items-center justify-center hover:text-primary hover:border-primary transition-colors"
            >
              <FontAwesomeIcon icon={faYoutube} className="text-xs" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              className="w-8 h-8 rounded-md border border-light-border dark:border-dark-border flex items-center justify-center hover:text-primary hover:border-primary transition-colors"
            >
              <FontAwesomeIcon icon={faLinkedinIn} className="text-xs" />
            </a>
          </div>
        </div>

        {/* Explore Links */}
        <div className="flex flex-col gap-3">
          <h4 className="font-headline text-sm font-semibold text-light-on-surface dark:text-dark-on-surface">
            Explore Sports
          </h4>
          <ul className="flex flex-col gap-2 font-body text-sm text-light-muted dark:text-dark-muted">
            <li>
              <Link to={ROUTES.EXPLORE_MATCHES} className="hover:text-primary transition-colors">
                Football and Futsal
              </Link>
            </li>
            <li>
              <Link to={ROUTES.EXPLORE_MATCHES} className="hover:text-primary transition-colors">
                Indoor Badminton
              </Link>
            </li>
            <li>
              <Link to={ROUTES.EXPLORE_MATCHES} className="hover:text-primary transition-colors">
                Tape Ball Cricket
              </Link>
            </li>
            <li>
              <Link to={ROUTES.EXPLORE_MATCHES} className="hover:text-primary transition-colors">
                Basketball Runs
              </Link>
            </li>
            <li>
              <Link to={ROUTES.DESIGN_SYSTEM} className="text-primary hover:underline font-semibold">
                Component Library &amp; Design System
              </Link>
            </li>
          </ul>
        </div>

        {/* Locations */}
        <div className="flex flex-col gap-3">
          <h4 className="font-headline text-sm font-semibold text-light-on-surface dark:text-dark-on-surface">
            Active Hubs
          </h4>
          <ul className="flex flex-col gap-2 font-body text-sm text-light-muted dark:text-dark-muted">
            <li className="flex items-center gap-2">
              <FontAwesomeIcon icon={faLocationDot} className="text-xs text-primary" />
              <span>Banani and Gulshan, Dhaka</span>
            </li>
            <li className="flex items-center gap-2">
              <FontAwesomeIcon icon={faLocationDot} className="text-xs text-primary" />
              <span>Dhanmondi, Dhaka</span>
            </li>
            <li className="flex items-center gap-2">
              <FontAwesomeIcon icon={faLocationDot} className="text-xs text-primary" />
              <span>Uttara Sector 4 and 11</span>
            </li>
            <li className="flex items-center gap-2">
              <FontAwesomeIcon icon={faLocationDot} className="text-xs text-primary" />
              <span>Bashundhara Residential Area</span>
            </li>
          </ul>
        </div>

        {/* Safety and Trust */}
        <div className="flex flex-col gap-3">
          <h4 className="font-headline text-sm font-semibold text-light-on-surface dark:text-dark-on-surface">
            Trust and Community
          </h4>
          <ul className="flex flex-col gap-2 font-body text-sm text-light-muted dark:text-dark-muted">
            <li className="flex items-center gap-2">
              <FontAwesomeIcon icon={faShieldHalved} className="text-xs text-secondary" />
              <Link to="/#safety" className="hover:text-primary transition-colors">
                Verified Turfs
              </Link>
            </li>
            <li>
              <Link to={ROUTES.TERMS} className="hover:text-primary transition-colors">
                Terms of Participation
              </Link>
            </li>
            <li>
              <Link to={ROUTES.PRIVACY} className="hover:text-primary transition-colors">
                Privacy Protection
              </Link>
            </li>
            <li className="flex items-center gap-2">
              <FontAwesomeIcon icon={faEnvelope} className="text-xs text-primary" />
              <a href="mailto:support@khelahobe.bd" className="hover:text-primary transition-colors">
                support@khelahobe.bd
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-light-border dark:border-dark-border py-6 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 font-body text-xs text-light-muted dark:text-dark-muted">
          <p>© 2026 Khela Hobe Bangladesh. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to={ROUTES.PRIVACY} className="hover:underline">Privacy Policy</Link>
            <Link to={ROUTES.TERMS} className="hover:underline">Terms of Service</Link>
            <span>Asia/Dhaka</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
