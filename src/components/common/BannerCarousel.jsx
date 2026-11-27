import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faImages } from '@fortawesome/free-solid-svg-icons';

/**
 * Responsive banner image carousel supporting 1-4 optional tournament images.
 */
export const BannerCarousel = ({
  images = [],
  title = 'Tournament Banner',
  heightClass = 'h-56 sm:h-80',
}) => {
  const validImages = (Array.isArray(images) ? images : []).filter(Boolean).slice(0, 4);
  const [activeIndex, setActiveIndex] = useState(0);

  if (validImages.length === 0) {
    return (
      <div className={`w-full ${heightClass} bg-light-surface-elevated dark:bg-dark-surface-elevated flex items-center justify-center text-4xl`}>
        🏆
      </div>
    );
  }

  const safeIdx = activeIndex >= validImages.length ? 0 : activeIndex;
  const hasMultiple = validImages.length > 1;

  const goPrev = () => setActiveIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  const goNext = () => setActiveIndex((prev) => (prev + 1) % validImages.length);

  return (
    <div className="flex flex-col">
      <div className={`relative w-full ${heightClass} overflow-hidden bg-dark-background group`}>
        <img
          src={validImages[safeIdx]}
          alt={`${title} slide ${safeIdx + 1}`}
          className="w-full h-full object-cover transition-opacity duration-300"
        />

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous banner image"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-dark-background/75 hover:bg-primary hover:text-on-primary text-white border border-white/20 flex items-center justify-center backdrop-blur-sm transition-colors"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next banner image"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-dark-background/75 hover:bg-primary hover:text-on-primary text-white border border-white/20 flex items-center justify-center backdrop-blur-sm transition-colors"
            >
              <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
            </button>

            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-dark-background/80 text-white text-[11px] font-mono font-semibold flex items-center gap-1.5 backdrop-blur-sm">
              <FontAwesomeIcon icon={faImages} className="text-primary text-[10px]" />
              <span>{safeIdx + 1} / {validImages.length}</span>
            </div>

            <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-1.5">
              {validImages.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  aria-label={`View banner ${i + 1}`}
                  className={`h-2 rounded-full transition-all ${
                    i === safeIdx ? 'w-6 bg-primary' : 'w-2 bg-white/60 hover:bg-white'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {hasMultiple && (
        <div className="px-3 py-2 bg-light-background/70 dark:bg-dark-background/70 border-t border-light-border dark:border-dark-border flex items-center gap-2 overflow-x-auto scrollbar-none">
          {validImages.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`relative shrink-0 w-16 h-10 rounded overflow-hidden border-2 transition-all ${
                i === safeIdx ? 'border-primary ring-2 ring-primary/30' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img src={src} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default BannerCarousel;
