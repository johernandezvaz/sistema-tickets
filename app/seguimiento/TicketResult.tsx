import type { TicketDetalle, StatusTicket, Prioridad } from '@/lib/types';


interface StatusConfig {
  label: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
}

const STATUS_MAP: Record<StatusTicket, StatusConfig> = {
  levantado: {
    label: 'Levantado',
    bg: 'color-mix(in srgb, var(--color-navy) 10%, transparent)',
    text: 'var(--color-navy)',
    border: 'color-mix(in srgb, var(--color-navy) 25%, transparent)',
    dot: 'var(--color-navy)',
  },
  en_proceso: {
    label: 'En proceso',
    bg: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
    text: 'var(--color-primary)',
    border: 'color-mix(in srgb, var(--color-primary) 30%, transparent)',
    dot: 'var(--color-primary)',
  },
  finalizado: {
    label: 'Finalizado',
    bg: 'color-mix(in srgb, var(--color-success) 12%, transparent)',
    text: 'var(--color-success)',
    border: 'color-mix(in srgb, var(--color-success) 30%, transparent)',
    dot: 'var(--color-success)',
  },
  cancelado: {
    label: 'Cancelado',
    bg: 'color-mix(in srgb, var(--color-danger) 10%, transparent)',
    text: 'var(--color-danger)',
    border: 'color-mix(in srgb, var(--color-danger) 30%, transparent)',
    dot: 'var(--color-danger)',
  },
};

const PRIORIDAD_MAP: Record<Prioridad, { label: string; color: string }> = {
  baja: { label: 'Baja', color: 'var(--color-text-muted)' },
  media: { label: 'Media', color: 'var(--color-warning)' },
  alta: { label: 'Alta', color: 'var(--color-danger)' },
};


function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/Mexico_City',
  }).format(new Date(iso));
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide mb-0.5"
        style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </dt>
      <dd className="text-sm font-medium" style={{ color: 'var(--color-text-base)' }}>
        {children}
      </dd>
    </div>
  );
}


interface TicketResultProps {
  ticket: TicketDetalle;
}

export default function TicketResult({ ticket }: TicketResultProps) {
  const statusCfg = STATUS_MAP[ticket.status] ?? STATUS_MAP.levantado;
  const prioridadCfg = PRIORIDAD_MAP[ticket.prioridad] ?? PRIORIDAD_MAP.baja;
  const hasHold = ticket.hold_activo !== null;
  const isFinalizado = ticket.status === 'finalizado';
  const isCancelado = ticket.status === 'cancelado';

  return (
    <div className="flex flex-col gap-4">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest mb-0.5"
            style={{ color: 'var(--color-text-muted)' }}>
            Folio de seguimiento
          </p>
          <p className="text-2xl font-bold tracking-[0.15em]"
            style={{ color: 'var(--color-navy)', fontFamily: 'monospace' }}>
            {ticket.folio}
          </p>
        </div>

        <span
          className="inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold"
          style={{
            backgroundColor: statusCfg.bg,
            color: statusCfg.text,
            borderColor: statusCfg.border,
          }}
        >
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: statusCfg.dot }} />
          {statusCfg.label}
        </span>
      </div>

      {hasHold && (
        <div
          className="flex items-start gap-3 rounded-lg border px-4 py-3"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-warning) 8%, transparent)',
            borderColor: 'color-mix(in srgb, var(--color-warning) 35%, transparent)',
          }}
          role="status"
          aria-label="En espera de tercero"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round"
            className="mt-0.5 h-4 w-4 shrink-0"
            style={{ color: 'var(--color-warning)' }}
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-warning)' }}>
              En espera de tercero
            </p>
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-base)' }}>
              {ticket.hold_activo!.motivo}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Desde {formatDate(ticket.hold_activo!.iniciado_en)}
            </p>
          </div>
        </div>
      )}

      {isCancelado && (
        <div
          className="flex items-start gap-3 rounded-lg border px-4 py-3"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-danger) 8%, transparent)',
            borderColor: 'color-mix(in srgb, var(--color-danger) 30%, transparent)',
          }}
          role="status"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round"
            className="mt-0.5 h-4 w-4 shrink-0"
            style={{ color: 'var(--color-danger)' }}
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold" style={{ color: 'var(--color-danger)' }}>
              Ticket cancelado el {formatDate(ticket.cancelado_en)}
            </p>
            {ticket.motivo_cancelacion && (
              <p className="text-sm" style={{ color: 'var(--color-text-base)' }}>
                Motivo de cancelación: {ticket.motivo_cancelacion}
              </p>
            )}
          </div>
        </div>
      )}

      {isFinalizado && (
        <div
          className="flex items-start gap-3 rounded-lg border px-4 py-3"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-success) 8%, transparent)',
            borderColor: 'color-mix(in srgb, var(--color-success) 30%, transparent)',
          }}
          role="status"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth={2.2}
            strokeLinecap="round" strokeLinejoin="round"
            className="mt-0.5 h-4 w-4 shrink-0"
            style={{ color: 'var(--color-success)' }}
            aria-hidden="true"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold" style={{ color: 'var(--color-success)' }}>
              Ticket finalizado el {formatDate(ticket.finalizado_en)}
            </p>
            {ticket.mensaje_resolucion && (
              <p className="text-sm" style={{ color: 'var(--color-text-base)' }}>
                {ticket.mensaje_resolucion}
              </p>
            )}
          </div>
        </div>
      )}

      <hr style={{ borderColor: 'var(--color-border)' }} />

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Nombre">
          {ticket.nombre} {ticket.apellido}
        </Field>
        <Field label="Correo">
          {ticket.email}
        </Field>
        <Field label="Área del solicitante">
          {ticket.area_origen_nombre ?? <span style={{ color: 'var(--color-text-muted)' }}>No especificada</span>}
        </Field>
        <Field label="Área destino">
          {ticket.area_nombre ?? <span style={{ color: 'var(--color-text-muted)' }}>No asignada</span>}
        </Field>
        <Field label="Prioridad">
          <span style={{ color: prioridadCfg.color }}>
            {prioridadCfg.label}
          </span>
        </Field>
        <Field label="Fecha de creación">
          {formatDate(ticket.creado_en)}
        </Field>
        {(isFinalizado || isCancelado) && (
          <Field label="Fecha de cierre">
            {formatDate(isCancelado ? ticket.cancelado_en : ticket.finalizado_en)}
          </Field>
        )}
      </dl>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide mb-2"
          style={{ color: 'var(--color-text-muted)' }}>
          Descripción del problema
        </p>
        <div
          className="rounded-lg border px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'color-mix(in srgb, var(--color-navy) 3%, transparent)',
            color: 'var(--color-text-base)',
          }}
        >
          {ticket.mensaje}
        </div>
      </div>

    </div>
  );
}
