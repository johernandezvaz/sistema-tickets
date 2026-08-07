'use client';

import { useEffect, useCallback } from 'react';

interface ImageLightboxProps {
  url: string;
  onClose: () => void;
}

export default function ImageLightbox({ url, onClose }: ImageLightboxProps) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        backgroundColor: 'rgba(0,0,0,0.82)',
        animation: 'lb-fadein 180ms ease both',
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Vista de imagen"
    >
      <style>{`
        @keyframes lb-fadein  { from { opacity: 0 } to { opacity: 1 } }
      `}</style>

      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-white/20"
        style={{ color: '#fff', backgroundColor: 'rgba(255,255,255,0.12)' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden="true">
          <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
        </svg>
      </button>

      <img
        src={url}
        alt="Evidencia ampliada"
        className="rounded-lg shadow-2xl"
        style={{
          maxWidth: 'min(90vw, 1200px)',
          maxHeight: '88vh',
          objectFit: 'contain',
        }}
        onClick={e => e.stopPropagation()}
        draggable={false}
      />
    </div>
  );
}
