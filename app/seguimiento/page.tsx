import Link from 'next/link';
import SeguimientoForm from './SeguimientoForm';

export const metadata = {
  title: 'Dar seguimiento a un ticket',
};

export default function SeguimientoPage() {
  return (
    <div className="min-h-screen py-10 px-6">
      <div className="mx-auto max-w-xl">

        <div className="mb-8 flex flex-col items-center text-center">
          <img
            src="/safe-demo_logo-blc-Photoroom.png"
            alt="Safe Demo logo"
            className="mb-6 h-12 w-auto object-contain"
          />
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-navy)' }}>
            Dar seguimiento a mi ticket
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Ingresa el folio que recibiste al crear tu reporte.
          </p>
        </div>

        <div className="card">
          <SeguimientoForm />
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm transition-opacity hover:opacity-75"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
              fill="currentColor" className="h-4 w-4" aria-hidden="true">
              <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
            </svg>
            Volver al inicio
          </Link>
        </div>

      </div>
    </div>
  );
}
