import React, { createContext, useContext, useEffect, useState } from 'react';
import { STORAGE_KEYS } from '../constants/config';
import { THEME_MODES } from '../styles/theme';

const ThemeContext = createContext({
  theme: THEME_MODES.DARK,
  isDark: true,
  toggleTheme: () => {},
  setTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.THEME_MODE);
      return stored === THEME_MODES.LIGHT ? THEME_MODES.LIGHT : THEME_MODES.DARK;
    } catch {
      return THEME_MODES.DARK;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === THEME_MODES.DARK) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    try {
      localStorage.setItem(STORAGE_KEYS.THEME_MODE, theme);
    } catch (err) {
      console.warn('Failed to save theme setting', err);
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === THEME_MODES.DARK ? THEME_MODES.LIGHT : THEME_MODES.DARK));
  };

  const setTheme = (newTheme) => {
    if (newTheme === THEME_MODES.DARK || newTheme === THEME_MODES.LIGHT) {
      setThemeState(newTheme);
    }
  };

  const value = {
    theme,
    isDark: theme === THEME_MODES.DARK,
    toggleTheme,
    setTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
