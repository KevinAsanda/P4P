'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QrCodeSvgProps {
  value: string;
  size?: number;
  className?: string;
}

export default function QrCodeSvg({ value, size = 180, className = '' }: QrCodeSvgProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!value) return;
    QRCode.toDataURL(value, {
      width: size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url) => setDataUrl(url))
      .catch((err) => console.error('[QR Code Error]:', err));
  }, [value, size]);

  if (!dataUrl) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 rounded-xl animate-pulse ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-xs text-gray-400 font-mono">Generating QR...</span>
      </div>
    );
  }

  return (
    <div className={`bg-white p-2 rounded-xl border border-gray-200 shadow-sm ${className}`}>
      <img src={dataUrl} alt="Scan QR Code" width={size} height={size} className="rounded-lg" />
    </div>
  );
}
