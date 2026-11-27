import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

export const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  className = '',
}) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <nav
      aria-label="Pagination navigation"
      className={`flex items-center justify-center gap-1.5 select-none ${className}`}
    >
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Previous page"
        className="w-9 h-9 rounded-md border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-on-surface dark:text-dark-on-surface flex items-center justify-center transition-state hover:border-primary disabled:opacity-40 disabled:pointer-events-none"
      >
        <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
      </button>

      {getPageNumbers().map((page, idx) => {
        if (page === '...') {
          return (
            <span
              key={`ellipsis-${idx}`}
              className="w-9 h-9 flex items-center justify-center text-xs text-light-muted dark:text-dark-muted"
            >
              ...
            </span>
          );
        }

        const isActive = page === currentPage;
        return (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            aria-current={isActive ? 'page' : undefined}
            className={`
              w-9 h-9 rounded-md font-label text-xs font-semibold tabular-nums transition-state
              ${
                isActive
                  ? 'bg-primary text-on-primary font-bold shadow-sm'
                  : 'border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-on-surface dark:text-dark-on-surface hover:border-primary'
              }
            `}
          >
            {page}
          </button>
        );
      })}

      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Next page"
        className="w-9 h-9 rounded-md border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-on-surface dark:text-dark-on-surface flex items-center justify-center transition-state hover:border-primary disabled:opacity-40 disabled:pointer-events-none"
      >
        <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
      </button>
    </nav>
  );
};

export default Pagination;
