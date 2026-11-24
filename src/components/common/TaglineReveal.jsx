import React, { useEffect, useRef, useState } from 'react';

/**
 * Mandatory Tagline Reveal Section per Landing Page Design Skill B11
 * Minimum two lines. Words transition individually from 25-35% opacity
 * to 100% opacity in reading order using requestAnimationFrame throttled scroll
 * or IntersectionObserver, adhering to the B7 base deceleration curve.
 */
export const TaglineReveal = ({
  text = 'Every neighborhood in Bangladesh has a pitch waiting for tonight. Find your team and claim your game.',
  className = '',
}) => {
  const containerRef = useRef(null);
  const words = text.split(' ');
  const [activeCount, setActiveCount] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setPrefersReducedMotion(true);
      setActiveCount(words.length);
      return;
    }

    let rafId = null;

    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Start revealing when the section enters 75% of viewport
      const startTrigger = windowHeight * 0.85;
      const endTrigger = windowHeight * 0.25;

      if (rect.top > startTrigger) {
        setActiveCount(0);
      } else if (rect.top < endTrigger) {
        setActiveCount(words.length);
      } else {
        const progress = (startTrigger - rect.top) / (startTrigger - endTrigger);
        const count = Math.min(words.length, Math.floor(progress * words.length));
        setActiveCount(count);
      }
    };

    const throttledScroll = () => {
      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          handleScroll();
          rafId = null;
        });
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', throttledScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [words.length]);

  return (
    <section
      ref={containerRef}
      className={`py-16 sm:py-24 max-w-4xl mx-auto px-6 text-center select-none ${className}`}
      aria-label="Platform Manifesto"
    >
      <p className="heading-3 sm:heading-2 font-headline font-semibold leading-tight tracking-tight text-balance">
        {words.map((word, index) => {
          const isRevealed = prefersReducedMotion || index < activeCount;
          return (
            <span
              key={index}
              className={`
                inline-block mr-[0.3em] transition-all duration-500
                ${
                  isRevealed
                    ? 'text-light-on-background dark:text-dark-on-background opacity-100 scale-100'
                    : 'text-light-muted/30 dark:text-dark-muted/25 opacity-30 scale-[0.98]'
                }
              `}
              style={{
                transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              {word}
            </span>
          );
        })}
      </p>
    </section>
  );
};

export default TaglineReveal;
