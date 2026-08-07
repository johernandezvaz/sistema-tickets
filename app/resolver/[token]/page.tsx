import { notFound } from 'next/navigation';
import { validateToken, getEvidencias } from '@/lib/resolution';
import { registrarAccesoAction } from '@/app/actions/resolver';
import ResolverForm from './ResolverForm';

export const metadata = {
  title: 'Resolución de Ticket',
  description: 'Portal de resolución público para el seguimiento de incidencias.',
};

export const dynamic = 'force-dynamic';

export default async function PublicResolverPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const validation = await validateToken(token);

  if (!validation) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-md card text-center flex flex-col items-center gap-4">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-xl"
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-danger) 10%, transparent)' }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth={1.8}
              strokeLinecap="round" strokeLinejoin="round"
              className="h-7 w-7"
              style={{ color: 'var(--color-danger)' }}
              aria-hidden="true"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>

          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--color-navy)' }}>
              Enlace inválido o expirado
            </h1>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
              Este enlace de resolución ya no está activo. Esto puede ocurrir si el ticket fue reasignado a otro técnico, si se generó un nuevo enlace para el ticket, o si el enlace ya fue cerrado.
            </p>
          </div>

          <p className="text-xs mt-2" style={{ color: 'var(--color-muted)' }}>
            Por favor, solicita un nuevo enlace de resolución al administrador del sistema.
          </p>
        </div>
      </main>
    );
  }

  const initialEvidencias = await getEvidencias(validation.ticketId);

  await registrarAccesoAction(token);

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
            Portal de Resolución
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Actualiza el estado de la incidencia y registra las evidencias necesarias.
          </p>
        </div>

        <div className="card">
          <ResolverForm
            token={token}
            ticket={validation.ticket}
            initialEvidencias={initialEvidencias}
          />
        </div>

      </div>
    </div>
  );
}
