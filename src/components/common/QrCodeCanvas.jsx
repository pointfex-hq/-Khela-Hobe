import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

/**
 * Generates an actual high-contrast scannable QR code image for a ticket payload or code.
 */
export const QrCodeCanvas = ({
  value,
  size = 128,
  alt = 'Ticket QR Code',
  className = '',
}) => {
  const [dataUrl, setDataUrl] = useState('');

  useEffect(() => {
    let active = true;
    if (!value) {
      setDataUrl('');
      return undefined;
    }

    QRCode.toDataURL(String(value), {
      width: Math.max(240, size * 2),
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0D1714',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        if (active) setDataUrl(url);
      })
      .catch(() => {
        if (active) setDataUrl('');
      });

    return () => {
      active = false;
    };
  }, [value, size]);

  if (!dataUrl) {
    return (
      <div
        className={`bg-white rounded flex items-center justify-center text-[10px] font-mono text-dark-background/60 ${className}`}
        style={{ width: size, height: size }}
      >
        QR...
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt={alt}
      width={size}
      height={size}
      className={`block bg-white rounded object-contain ${className}`}
    />
  );
};

export default QrCodeCanvas;
