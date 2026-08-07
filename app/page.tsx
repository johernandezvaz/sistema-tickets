import Link from 'next/link';

export const metadata = {
  title: 'Inicio | Sistema de Tickets',
  description: 'Portal de soporte interno Safe Demo. Levanta un ticket o consulta el estado de uno existente.',
};

export default function HomePage() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-6 py-16">

      <div className="absolute top-6 right-6">
        <Link
          href="/admin/login"
          className="inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition-colors hover:bg-white/50"
          style={{
            borderColor: 'var(--color-border)',
            color: 'var(--color-navy)',
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
            <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
          </svg>
          Acceso Administrativo
        </Link>
      </div>

      <div className="mb-12 flex flex-col items-center gap-4">
        <img
          src="/safe-demo_logo-blc-Photoroom.png"
          alt="Safe Demo logo"
          className="h-16 w-auto object-contain"
        />
        <div className="text-center">
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ color: 'var(--color-navy)' }}
          >
            Portal de Soporte
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            ¿En qué podemos ayudarte hoy?
          </p>
        </div>
      </div>

      <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-5">

        <Link
          href="/levantar"
          className="group card flex flex-col items-center gap-4 p-8 text-center
                     transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md
                     focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ outlineColor: 'var(--color-primary)' }}
        >
          <span
            className="flex h-14 w-14 items-center justify-center rounded-xl
                       transition-colors duration-200"
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 12%, transparent)' }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth={1.8}
              strokeLinecap="round" strokeLinejoin="round"
              className="h-7 w-7"
              style={{ color: 'var(--color-primary)' }}
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>

          <div>
            <p
              className="text-lg font-semibold"
              style={{ color: 'var(--color-navy)' }}
            >
              Levantar un ticket
            </p>
            <p className="mt-1 text-sm leading-snug" style={{ color: 'var(--color-text-muted)' }}>
              Reporta un problema o solicita apoyo al área correspondiente.
            </p>
          </div>

          <span
            className="mt-auto inline-flex items-center gap-1.5 rounded-lg px-4 py-2
                       text-sm font-medium text-white transition-opacity group-hover:opacity-90"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Comenzar
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
              <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
            </svg>
          </span>
        </Link>

        <Link
          href="/seguimiento"
          className="group card flex flex-col items-center gap-4 p-8 text-center
                     transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md
                     focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ outlineColor: 'var(--color-navy)' }}
        >

          <span
            className="flex h-14 w-14 items-center justify-center rounded-xl
                       transition-colors duration-200"
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-navy) 10%, transparent)' }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth={1.8}
              strokeLinecap="round" strokeLinejoin="round"
              className="h-7 w-7"
              style={{ color: 'var(--color-navy)' }}
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </span>

          <div>
            <p
              className="text-lg font-semibold"
              style={{ color: 'var(--color-navy)' }}
            >
              Dar seguimiento
            </p>
            <p className="mt-1 text-sm leading-snug" style={{ color: 'var(--color-text-muted)' }}>
              Consulta el estado de un ticket existente usando tu folio.
            </p>
          </div>

          <span
            className="mt-auto inline-flex items-center gap-1.5 rounded-lg px-4 py-2
                       text-sm font-medium text-white transition-opacity group-hover:opacity-90"
            style={{ backgroundColor: 'var(--color-navy)' }}
          >
            Consultar
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
              <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
            </svg>
          </span>
        </Link>

      </div>

      <p className="mt-12 text-xs" style={{ color: 'var(--color-muted)' }}>
        Safe Demo · Sistema de Tickets Interno
      </p>
    </main>
  );
}
