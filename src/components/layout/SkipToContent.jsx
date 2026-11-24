import React from 'react';

export const SkipToContent = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 px-4 py-2 bg-primary text-on-primary font-label text-sm font-semibold rounded-md shadow-lg outline-none"
    >
      Skip to content
    </a>
  );
};

export default SkipToContent;
