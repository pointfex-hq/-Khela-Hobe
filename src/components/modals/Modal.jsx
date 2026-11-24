import React, { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-dark-background/80 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Surface Dialog */}
      <div
        className={`
          relative w-full ${maxWidth} rounded-xl
          bg-light-surface dark:bg-dark-surface
          border border-light-border dark:border-dark-border
          shadow-2xl z-10 overflow-hidden
          transition-all duration-surface-enter ease-out
          flex flex-col max-h-[90vh]
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-light-border dark:border-dark-border">
          <h3 className="font-headline text-lg font-bold text-light-on-surface dark:text-dark-on-surface">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-md flex items-center justify-center text-light-muted dark:text-dark-muted hover:text-light-on-surface dark:hover:text-dark-on-surface hover:bg-light-surface-elevated dark:hover:bg-dark-surface-elevated transition-colors"
          >
            <FontAwesomeIcon icon={faXmark} className="text-sm" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto font-body text-sm text-light-on-surface dark:text-dark-on-surface">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
