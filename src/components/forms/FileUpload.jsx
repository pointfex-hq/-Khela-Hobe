import React, { useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudArrowUp, faFile, faXmark } from '@fortawesome/free-solid-svg-icons';

export const FileUpload = ({
  label = 'Upload Document or Photo',
  helperText = 'PNG, JPG, or PDF up to 10MB',
  error,
  accept = 'image/*,.pdf',
  onFileSelect,
  className = '',
  disabled = false,
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (file) => {
    if (!file) return;
    setSelectedFile(file);
    if (onFileSelect) onFileSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFileChange(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onFileSelect) onFileSelect(null);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label className="font-label text-xs sm:text-sm font-semibold text-light-on-background dark:text-dark-on-background">
          {label}
        </label>
      )}

      <div
        onClick={() => !disabled && fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-3
          transition-state cursor-pointer text-center select-none
          ${
            isDragging
              ? 'border-primary bg-primary/10'
              : selectedFile
              ? 'border-primary/60 bg-light-surface-elevated dark:bg-dark-surface-elevated'
              : 'border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface hover:border-primary/60'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
          ${error ? 'border-error' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          disabled={disabled}
          onChange={(e) => handleFileChange(e.target.files?.[0])}
          className="hidden"
        />

        {selectedFile ? (
          <div className="flex items-center justify-between w-full max-w-sm px-3 py-2 rounded-md bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border">
            <div className="flex items-center gap-2.5 min-w-0">
              <FontAwesomeIcon icon={faFile} className="text-primary text-base shrink-0" />
              <div className="flex flex-col text-left min-w-0">
                <span className="font-title text-xs font-semibold text-light-on-surface dark:text-dark-on-surface truncate">
                  {selectedFile.name}
                </span>
                <span className="font-body text-[11px] text-light-muted dark:text-dark-muted tabular-nums">
                  {formatSize(selectedFile.size)}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              aria-label="Remove selected file"
              className="w-6 h-6 rounded flex items-center justify-center text-light-muted dark:text-dark-muted hover:text-error hover:bg-error/10 transition-colors ml-2 shrink-0"
            >
              <FontAwesomeIcon icon={faXmark} className="text-xs" />
            </button>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-light-surface-elevated dark:bg-dark-surface-elevated flex items-center justify-center text-primary border border-light-border dark:border-dark-border">
              <FontAwesomeIcon icon={faCloudArrowUp} className="text-xl" />
            </div>
            <div>
              <p className="font-title text-sm font-semibold text-light-on-surface dark:text-dark-on-surface">
                Click to browse or drop file here
              </p>
              <p className="font-body text-xs text-light-muted dark:text-dark-muted mt-0.5">
                {helperText}
              </p>
            </div>
          </>
        )}
      </div>

      {error && <span className="font-label text-xs text-error mt-0.5">{error}</span>}
    </div>
  );
};

export default FileUpload;
