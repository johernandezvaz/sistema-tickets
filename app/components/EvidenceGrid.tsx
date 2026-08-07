'use client';

import { useState } from 'react';
import ImageLightbox from './ImageLightbox';
import type { TicketEvidencia } from '@/lib/types';

interface EvidenceGridProps {
  evidencias: TicketEvidencia[];
  urlPrefix: string;
  cols?: 'two' | 'four';
  thumbnailHeight?: string;
  borderColor?: string;
}

export default function EvidenceGrid({
  evidencias,
  urlPrefix,
  cols = 'four',
  thumbnailHeight = 'h-20',
  borderColor = 'var(--color-border)',
}: EvidenceGridProps) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  if (evidencias.length === 0) return null;

  const gridClass = cols === 'two'
    ? 'grid grid-cols-2 gap-2'
    : 'grid grid-cols-2 sm:grid-cols-4 gap-3';

  return (
    <>
      <div className={gridClass}>
        {evidencias.map(ev => {
          const src = `${urlPrefix}/${ev.ruta_archivo}`;
          return (
            <button
              key={ev.id}
              type="button"
              onClick={() => setLightboxUrl(src)}
              className="group block overflow-hidden rounded-lg border transition-transform hover:scale-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
              style={{ borderColor }}
              aria-label="Ver imagen de evidencia"
            >
              <img
                src={src}
                alt="Evidencia"
                className={`${thumbnailHeight} w-full object-cover transition-transform group-hover:scale-105`}
              />
            </button>
          );
        })}
      </div>

      {lightboxUrl && (
        <ImageLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      )}
    </>
  );
}
