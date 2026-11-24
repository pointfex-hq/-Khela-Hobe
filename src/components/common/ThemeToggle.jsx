import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons';

export const ThemeToggle = ({ className = '' }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`
        inline-flex items-center justify-center w-9 h-9 rounded-md
        bg-light-surface dark:bg-dark-surface
        border border-light-border dark:border-dark-border
        text-light-on-surface dark:text-dark-on-surface
        hover:border-primary hover:text-primary
        transition-colors duration-state-change
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
        ${className}
      `}
    >
      <FontAwesomeIcon icon={isDark ? faSun : faMoon} className="text-sm" />
    </button>
  );
};

export default ThemeToggle;
