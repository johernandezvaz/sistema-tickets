'use client';

import { useCallback } from 'react';
import type { TicketDetalle, TicketEvidencia, Prioridad } from '@/lib/types';
import { subirEvidenciaAction, actualizarTicketAction } from '@/app/actions/resolver';
import TicketResolutionControls, { type ResolutionActions } from '@/app/components/TicketResolutionControls';

interface ResolverFormProps {
  token: string;
  ticket: TicketDetalle;
  initialEvidencias: TicketEvidencia[];
}

const PRIORIDAD_MAP: Record<Prioridad, { label: string; color: string }> = {
  baja: { label: 'Baja', color: 'var(--color-text-muted)' },
  media: { label: 'Media', color: 'var(--color-warning)' },
  alta: { label: 'Alta', color: 'var(--color-danger)' },
};

export default function ResolverForm({ token, ticket, initialEvidencias }: ResolverFormProps) {
  const prioridadCfg = PRIORIDAD_MAP[ticket.prioridad] ?? PRIORIDAD_MAP.baja;

  const actions: ResolutionActions = {
    uploadEvidence: useCallback(async (formData: FormData) => {
      return subirEvidenciaAction(token, formData);
    }, [token]),
    submitResolution: useCallback(async (formData: FormData) => {
      const res = await actualizarTicketAction(token, formData);
      if (res.ok) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return res;
    }, [token]),
  };

  return (
    <div className="flex flex-col gap-6">

      <div className="rounded-xl border p-5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'color-mix(in srgb, var(--color-navy) 2%, transparent)' }}>
        <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--color-navy)' }}>
          Información del Ticket (Solo lectura)
        </h3>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Folio
            </dt>
            <dd className="font-mono font-bold" style={{ color: 'var(--color-navy)' }}>
              {ticket.folio}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Solicitante
            </dt>
            <dd className="font-medium" style={{ color: 'var(--color-text-base)' }}>
              {ticket.nombre} {ticket.apellido}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Correo corporativo
            </dt>
            <dd className="font-medium" style={{ color: 'var(--color-text-base)' }}>
              {ticket.email}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Área
            </dt>
            <dd className="font-medium" style={{ color: 'var(--color-text-base)' }}>
              {ticket.area_nombre ?? 'Sin asignar'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Prioridad
            </dt>
            <dd className="font-bold" style={{ color: prioridadCfg.color }}>
              {prioridadCfg.label}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Fecha de creación
            </dt>
            <dd className="font-medium" style={{ color: 'var(--color-text-base)' }}>
              {new Intl.DateTimeFormat('es-MX', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(ticket.creado_en))}
            </dd>
          </div>
        </dl>

        <div className="mt-5">
          <dt className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
            Descripción
          </dt>
          <dd className="rounded-lg border px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap" style={{ borderColor: 'var(--color-border)', backgroundColor: '#fff' }}>
            {ticket.mensaje}
          </dd>
        </div>
      </div>

      <div className="rounded-xl border p-5" style={{ borderColor: 'var(--color-border)', backgroundColor: '#fff' }}>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--color-navy)' }}>
          Actualizar estado del ticket
        </h3>

        <TicketResolutionControls
          initialStatus={ticket.status}
          initialHoldActivo={ticket.hold_activo !== null}
          initialHoldMotivo={ticket.hold_activo?.motivo ?? ''}
          initialMensajeResolucion={ticket.mensaje_resolucion ?? ''}
          initialEvidencias={initialEvidencias}
          evidenceUrlPrefix={`/api/evidencia/${token}`}
          actions={actions}
          submitLabel="Guardar cambios"
          size="md"
        />
      </div>

    </div>
  );
}
