import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop Component
 * Ensures every route navigation or query transition keeps the user at the top
 * of the page instead of inheriting previous scroll offset, unless a specific
 * hash anchor is targeted.
 */
export const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Only scroll if there is no explicit anchor hash like #sports or #safety
    if (!window.location.hash) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant',
      });
    }
  }, [pathname, search]);

  return null;
};

export default ScrollToTop;
