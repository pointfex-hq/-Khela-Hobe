import { useEffect, useRef, useState } from 'react';

export const useIntersectionObserver = (options = { threshold: 0.15, rootMargin: '0px' }) => {
  const targetRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    }, options);

    const currentElem = targetRef.current;
    if (currentElem) {
      observer.observe(currentElem);
    }

    return () => {
      if (currentElem) {
        observer.unobserve(currentElem);
      }
    };
  }, [options.threshold, options.rootMargin]);

  return [targetRef, isVisible];
};
