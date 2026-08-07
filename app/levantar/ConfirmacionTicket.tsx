'use client';

import Link from 'next/link';

interface ConfirmacionTicketProps {
  folio: string;
}

export default function ConfirmacionTicket({ folio }: ConfirmacionTicketProps) {
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
          ¡Tu ticket fue levantado con éxito!
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
          borderColor: 'color-mix(in srgb, var(--color-warning) 40%, transparent)',
          backgroundColor: 'color-mix(in srgb, var(--color-warning) 8%, transparent)',
          color: 'var(--color-warning)',
        }}
        role="alert"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth={2}
          strokeLinecap="round" strokeLinejoin="round"
          className="mt-0.5 h-4 w-4 shrink-0"
          aria-hidden="true"
        >
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span>
          <strong>Guarda este folio.</strong> Es la única forma de consultar el estado
          de tu ticket. No te lo enviaremos por correo automáticamente.
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
        <button
          onClick={() => navigator.clipboard?.writeText(folio)}
          className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium
                     transition-colors hover:bg-white/60"
          style={{
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-base)',
          }}
          type="button"
        >
          Copiar folio
        </button>

        <Link
          href="/"
          className="flex-1 rounded-lg px-4 py-2.5 text-center text-sm
                     font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          Volver al inicio
        </Link>
      </div>

    </div>
  );
}
