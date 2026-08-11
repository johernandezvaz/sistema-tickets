'use client';

import { useState } from 'react';
import Link from 'next/link';
import { copyToClipboard } from '@/lib/clipboard';

interface ConfirmacionTicketProps {
  folio: string;
  nombre: string;
  email: string;
}

export default function ConfirmacionTicket({ folio, nombre, email }: ConfirmacionTicketProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  async function handleCopy() {
    setCopyError(false);
    const success = await copyToClipboard(folio);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setCopyError(true);
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 text-center animate-in fade-in duration-300">

      <span
        className="flex h-16 w-16 items-center justify-center rounded-full"
        style={{ backgroundColor: 'color-mix(in srgb, var(--color-success) 15%, transparent)' }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth={2.2}
          strokeLinecap="round" strokeLinejoin="round"
          className="h-8 w-8"
          style={{ color: 'var(--color-success)' }}
          aria-hidden="true"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>

      <div>
        <p className="text-sm font-medium uppercase tracking-widest"
          style={{ color: 'var(--color-success)' }}>
          Ticket registrado
        </p>
        <h2 className="mt-1 text-2xl font-bold"
          style={{ color: 'var(--color-navy)' }}>
          ¡Hola {nombre}, tu ticket fue levantado con éxito!
        </h2>
      </div>

      <div
        className="w-full rounded-xl border-2 px-6 py-5"
        style={{
          borderColor: 'var(--color-primary)',
          backgroundColor: 'color-mix(in srgb, var(--color-primary) 5%, transparent)',
        }}
      >
        <p className="mb-1 text-xs font-medium uppercase tracking-widest"
          style={{ color: 'var(--color-text-muted)' }}>
          Tu folio de seguimiento
        </p>
        <p
          className="text-4xl font-bold tracking-[0.3em] select-all"
          style={{ color: 'var(--color-primary)', fontFamily: 'monospace' }}
        >
          {folio}
        </p>
      </div>

      <div
        className="w-full flex items-start gap-3 rounded-lg border px-4 py-3 text-left text-sm"
        style={{
          borderColor: 'color-mix(in srgb, var(--color-primary) 35%, transparent)',
          backgroundColor: 'color-mix(in srgb, var(--color-primary) 6%, transparent)',
          color: 'var(--color-primary)',
        }}
        role="status"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth={2}
          strokeLinecap="round" strokeLinejoin="round"
          className="mt-0.5 h-4 w-4 shrink-0"
          aria-hidden="true"
        >
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
        <span>
          Te enviamos un correo de confirmación a <strong>{email}</strong> con tu folio.
          Consérvalo para consultar o dar seguimiento a tu solicitud.
        </span>
      </div>

      <div className="flex flex-col gap-2 w-full pt-2">
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={handleCopy}
            className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-white/60 flex items-center justify-center gap-2"
            style={{
              borderColor: copied ? 'var(--color-success)' : 'var(--color-border)',
              color: copied ? 'var(--color-success)' : 'var(--color-text-base)',
              backgroundColor: copied ? 'color-mix(in srgb, var(--color-success) 8%, transparent)' : 'transparent',
            }}
            type="button"
          >
            {copied ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <span>¡Folio copiado!</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
                <span>Copiar folio</span>
              </>
            )}
          </button>

          <Link
            href="/"
            className="flex-1 rounded-lg px-4 py-2.5 text-center text-sm font-medium text-white transition-opacity hover:opacity-90 flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Volver al inicio
          </Link>
        </div>

        {copyError && (
          <p className="text-xs text-center font-medium text-red-600 dark:text-red-400 mt-1">
            No se pudo copiar, selecciona el texto manualmente
          </p>
        )}
      </div>

    </div>
  );
}

