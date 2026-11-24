/**
 * Khela Hobe Design System Theme Configuration
 * Dark mode is the primary visual identity; light mode is the clean daytime alternative.
 */

export const THEME_MODES = {
  DARK: 'dark',
  LIGHT: 'light',
};

export const COLOR_TOKENS = {
  // Shared brand colors
  primary: '#B9F34A',
  onPrimary: '#131F00',
  secondary: '#26865B',
  onSecondary: '#FFFFFF',
  accent: '#FF9F43',
  onAccent: '#1F1100',
  success: '#32C77A',
  warning: '#FFC857',
  error: '#FF5C5C',

  // Dark Theme
  dark: {
    background: '#101A17',
    surface: '#1B2923',
    surfaceElevated: '#23342D',
    text: '#FFFFFF',
    mutedText: '#9BAAA2',
    border: '#2C3B34',
  },

  // Light Theme
  light: {
    background: '#F4F8F5',
    surface: '#FFFFFF',
    surfaceElevated: '#E8F3EE',
    text: '#101A17',
    mutedText: '#56615D',
    border: '#D0DDD6',
  },
};

export const FONTS = {
  headings: 'Manrope, sans-serif',
  body: 'Inter, sans-serif',
  monospace: 'Fragment Mono, monospace',
};

export const BREAKPOINTS = {
  mobile: '320px–767px',
  tablet: '768px–1023px',
  desktop: '1024px–1439px',
  largeDesktop: '1440px+',
};

export const MOTION = {
  stateChange: '120ms ease-out',
  surfaceEnter: '220ms cubic-bezier(0.2, 0, 0, 1)',
  surfaceExit: '150ms cubic-bezier(0.3, 0, 1, 1)',
  baseCurve: '500ms cubic-bezier(0.22, 1, 0.36, 1)',
};
