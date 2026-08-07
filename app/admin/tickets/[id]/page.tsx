import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { getAdminTicketById } from '@/lib/tickets';
import { getEvidencias } from '@/lib/resolution';
import TicketAdminPanel from './TicketAdminPanel';
import EvidenceGrid from '@/app/components/EvidenceGrid';

export const metadata = {
  title: 'Detalle de Ticket | Panel Admin',
};

export const dynamic = 'force-dynamic';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/Mexico_City',
  }).format(new Date(iso));
}

export default async function AdminTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/admin/login');
  }

  const { id: rawId } = await params;
  const ticketId = parseInt(rawId, 10);

  if (isNaN(ticketId)) {
    notFound();
  }

  const ticket = await getAdminTicketById(ticketId, session.rol, session.area_id);

  if (!ticket) {
    notFound();
  }

  const evidencias = await getEvidencias(ticketId);
  const adminFullName = `${session.nombre} ${session.apellido}`;

  const isResolved = ticket.status === 'finalizado';
  const isCancelled = ticket.status === 'cancelado';

  const statusCfg: Record<string, { label: string; bg: string; text: string }> = {
    levantado: {
      label: 'Levantado',
      bg: 'color-mix(in srgb, var(--color-navy) 10%, transparent)',
      text: 'var(--color-navy)',
    },
    en_proceso: {
      label: 'En proceso',
      bg: 'color-mix(in srgb, var(--color-primary) 12%, transparent)',
      text: 'var(--color-primary)',
    },
    finalizado: {
      label: 'Finalizado',
      bg: 'color-mix(in srgb, var(--color-success) 12%, transparent)',
      text: 'var(--color-success)',
    },
    cancelado: {
      label: 'Cancelado',
      bg: 'color-mix(in srgb, var(--color-danger) 10%, transparent)',
      text: 'var(--color-danger)',
    },
  };

  const currentStatus = statusCfg[ticket.status] ?? statusCfg.levantado;

  const priorityCfg: Record<string, { label: string; color: string }> = {
    baja: { label: 'Baja', color: 'var(--color-text-muted)' },
    media: { label: 'Media', color: 'var(--color-warning)' },
    alta: { label: 'Alta', color: 'var(--color-danger)' },
  };
  const currentPriority = priorityCfg[ticket.prioridad] ?? priorityCfg.baja;

  return (
    <div className="flex flex-col gap-6">

      <div className="flex flex-col gap-2">
        <Link
          href="/admin/tickets"
          className="inline-flex items-center gap-1.5 text-xs font-semibold hover:opacity-75"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
            <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
          </svg>
          Volver a la lista
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-1">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-navy)' }}>
              Ticket de Soporte
            </h1>
            <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Folio: {ticket.folio}
            </p>
          </div>

          <span
            className="inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
            style={{ backgroundColor: currentStatus.bg, color: currentStatus.text }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: currentStatus.text }} />
            {currentStatus.label}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        <div className="lg:col-span-2 flex flex-col gap-6">

          {ticket.hold_activo && (
            <div
              className="flex items-start gap-3 rounded-lg border px-4 py-3"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-warning) 8%, transparent)',
                borderColor: 'color-mix(in srgb, var(--color-warning) 30%, transparent)',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--color-warning)' }} aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-warning)' }}>
                  En espera de tercero
                </p>
                <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-base)' }}>
                  {ticket.hold_activo.motivo}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  Iniciado el {formatDate(ticket.hold_activo.iniciado_en)}
                </p>
              </div>
            </div>
          )}

          {isCancelled && (
            <div
              className="flex items-start gap-3 rounded-lg border px-4 py-3"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-danger) 8%, transparent)',
                borderColor: 'color-mix(in srgb, var(--color-danger) 25%, transparent)',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--color-danger)' }} aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-danger)' }}>
                  Ticket Cancelado
                </p>
                <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-base)' }}>
                  {ticket.motivo_cancelacion ?? 'Sin motivo de cancelación registrado.'}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  Cancelado el {formatDate(ticket.cancelado_en)}
                </p>
              </div>
            </div>
          )}

          {isResolved && !isCancelled && (
            <div
              className="flex flex-col gap-3 rounded-lg border px-4 py-3"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-success) 8%, transparent)',
                borderColor: 'color-mix(in srgb, var(--color-success) 25%, transparent)',
              }}
            >
              <div className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--color-success)' }} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-success)' }}>
                    Ticket Resuelto
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-base)' }}>
                    {ticket.mensaje_resolucion ?? 'Sin mensaje de resolución registrado.'}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                    Finalizado el {formatDate(ticket.finalizado_en)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="card flex flex-col gap-6">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>
                  Solicitante
                </dt>
                <dd className="text-sm font-semibold" style={{ color: 'var(--color-text-base)' }}>
                  {ticket.nombre} {ticket.apellido}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>
                  Correo Corporativo
                </dt>
                <dd className="text-sm font-semibold" style={{ color: 'var(--color-text-base)' }}>
                  {ticket.email}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>
                  Área Destino
                </dt>
                <dd className="text-sm font-semibold" style={{ color: 'var(--color-text-base)' }}>
                  {ticket.area_nombre ?? 'Sin asignar'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>
                  Prioridad
                </dt>
                <dd className="text-sm font-semibold" style={{ color: currentPriority.color }}>
                  {currentPriority.label}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>
                  Fecha de creación
                </dt>
                <dd className="text-sm font-semibold" style={{ color: 'var(--color-text-base)' }}>
                  {formatDate(ticket.creado_en)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>
                  Responsable Asignado
                </dt>
                <dd className="text-sm font-semibold" style={{ color: 'var(--color-text-base)' }}>
                  {ticket.responsable_nombre ?? <span className="italic opacity-60">Sin asignar</span>}
                </dd>
              </div>
              {(isResolved || isCancelled) && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>
                    Fecha de cierre
                  </dt>
                  <dd className="text-sm font-semibold" style={{ color: 'var(--color-text-base)' }}>
                    {formatDate(isCancelled ? ticket.cancelado_en : ticket.finalizado_en)}
                  </dd>
                </div>
              )}
            </dl>

            <hr style={{ borderColor: 'var(--color-border)' }} />

            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
                Descripción del Problema
              </h2>
              <div
                className="rounded-lg border px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
                style={{
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'color-mix(in srgb, var(--color-navy) 2%, transparent)',
                  color: 'var(--color-text-base)',
                }}
              >
                {ticket.mensaje}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <TicketAdminPanel
            ticket={ticket}
            userRol={session.rol}
            adminFullName={adminFullName}
            adminId={parseInt(session.sub, 10)}
            initialEvidencias={evidencias}
          />
        </div>
      </div>
    </div>
  );
}
