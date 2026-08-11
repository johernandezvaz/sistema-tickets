'use client';

import { useState, useCallback } from 'react';
import {
  asignarResponsableAction,
  reasignarAction,
  generarLinkResolucionAction,
  subirEvidenciaAdminAction,
  resolverDirectamenteAction,
} from '@/app/admin/actions/admin-tickets';
import type { AdminTicketDetail } from '@/lib/tickets';
import type { TicketEvidencia, StatusTicket, Prioridad } from '@/lib/types';
import TicketResolutionControls, { type ResolutionActions } from '@/app/components/TicketResolutionControls';
import EvidenceGrid from '@/app/components/EvidenceGrid';
import { copyToClipboard } from '@/lib/clipboard';

interface TicketAdminPanelProps {
  ticket: AdminTicketDetail;
  userRol?: string;
  adminFullName: string;
  adminId: number;
  initialEvidencias: TicketEvidencia[];
}

export default function TicketAdminPanel({
  ticket,
  userRol,
  adminFullName,
  adminId,
  initialEvidencias,
}: TicketAdminPanelProps) {

  const [linkUrl, setLinkUrl] = useState<string | null>(
    ticket.link_activo
      ? `${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:4559'}/resolver/${ticket.link_activo.token}`
      : null
  );
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkWarn, setLinkWarn] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [otraPersona, setOtraPersona] = useState('');

  const [reasignLoading, setReasignLoading] = useState(false);

  const [ticketStatus, setTicketStatus] = useState<StatusTicket>(ticket.status as StatusTicket);
  const [resolvedMessage, setResolvedMessage] = useState<string>(
    ticket.status === 'cancelado'
      ? (ticket.motivo_cancelacion ?? '')
      : (ticket.mensaje_resolucion ?? '')
  );
  const [evidencias, setEvidencias] = useState<TicketEvidencia[]>(initialEvidencias);

  const isResolved = ticketStatus === 'finalizado' || ticketStatus === 'cancelado';
  const isSuperadmin = userRol === 'superadmin';

  const sinAsignar = ticket.responsable_nombre === null;
  const asignadoAMi = !sinAsignar && ticket.asignado_admin_id === adminId;

  const resolveActions: ResolutionActions = {
    uploadEvidence: useCallback(async (formData: FormData) => {
      const res = await subirEvidenciaAdminAction(ticket.id, formData);
      if (res.ok && res.evidencia) {
        setEvidencias(prev => [...prev, res.evidencia!]);
      }
      return res;
    }, [ticket.id]),
    submitResolution: useCallback(async (formData: FormData) => {
      const res = await resolverDirectamenteAction(ticket.id, formData);
      const newStatus = formData.get('status') as StatusTicket;
      const newMensaje = formData.get('mensaje_resolucion') as string;
      if (res.ok) {
        if (newMensaje) {
          setResolvedMessage(newMensaje);
        }
        if (newStatus === 'finalizado' || newStatus === 'cancelado') {
          setTicketStatus(newStatus);
        }
      }
      return res;
    }, [ticket.id]),
  };

  async function handleAsignarme() {
    setAssignLoading(true);
    setAssignError(null);
    try {
      const res = await asignarResponsableAction(ticket.id, adminFullName, true);
      if (!res.ok) setAssignError(res.error ?? 'Ocurrió un error al asignarte.');
    } catch {
      setAssignError('Error de red al asignar.');
    } finally {
      setAssignLoading(false);
    }
  }

  async function handleAsignarOtro(e: React.FormEvent) {
    e.preventDefault();
    setAssignLoading(true);
    setAssignError(null);
    try {
      const res = await asignarResponsableAction(ticket.id, otraPersona, false);
      if (!res.ok) setAssignError(res.error ?? 'Ocurrió un error al asignar.');
    } catch {
      setAssignError('Error de red al asignar.');
    } finally {
      setAssignLoading(false);
    }
  }

  async function handleReasignar() {
    setReasignLoading(true);
    try {
      await reasignarAction(ticket.id);
    } catch {

    } finally {
      setReasignLoading(false);
    }
  }

  async function handleGenerateLink() {
    setLinkLoading(true);
    setLinkError(null);
    setLinkWarn(false);
    setCopied(false);
    try {
      const res = await generarLinkResolucionAction(ticket.id);
      if (res.ok && res.url) {
        setLinkUrl(res.url);
        if (res.hadPrevious) setLinkWarn(true);
      } else {
        setLinkError(res.error ?? 'Ocurrió un error al generar el link.');
      }
    } catch {
      setLinkError('Error de red al generar el link.');
    } finally {
      setLinkLoading(false);
    }
  }

  async function handleCopy() {
    if (linkUrl) {
      setCopyError(false);
      const success = await copyToClipboard(linkUrl);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        setCopyError(true);
      }
    }
  }

  if (isSuperadmin) {
    const isFinalizado = ticket.status === 'finalizado';
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border p-5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <h3 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-navy)' }}>
            Vista de Administración
          </h3>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            Los privilegios de Super Admin para este ticket son de solo lectura. Las acciones de asignación de responsable y generación de enlaces de resolución corresponden a los administradores de área asignados.
          </p>
        </div>

        {isFinalizado && (
          <div className="rounded-xl border p-5" style={{ borderColor: 'color-mix(in srgb, var(--color-success) 30%, transparent)', backgroundColor: 'color-mix(in srgb, var(--color-success) 6%, transparent)' }}>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-success)' }}>
              Resolución del ticket
            </h4>
            <p className="text-sm leading-relaxed mb-1" style={{ color: 'var(--color-text-base)' }}>
              {ticket.mensaje_resolucion ?? 'Sin mensaje de resolución registrado.'}
            </p>
            {initialEvidencias.length > 0 && (
              <div className="mt-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-success)' }}>
                  Evidencias adjuntas
                </p>
                <EvidenceGrid
                  evidencias={initialEvidencias}
                  urlPrefix="/api/evidencia/admin"
                  cols="two"
                  thumbnailHeight="h-20"
                  borderColor="color-mix(in srgb, var(--color-success) 30%, transparent)"
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (isResolved) {
    const isCancelledStatus = ticketStatus === 'cancelado';
    return (
      <div className="flex flex-col gap-4">
        <div
          className="rounded-lg border p-4 text-center text-sm font-semibold"
          style={{
            borderColor: isCancelledStatus ? 'var(--color-danger)' : 'var(--color-success)',
            backgroundColor: isCancelledStatus
              ? 'color-mix(in srgb, var(--color-danger) 5%, transparent)'
              : 'color-mix(in srgb, var(--color-success) 5%, transparent)',
            color: isCancelledStatus ? 'var(--color-danger)' : 'var(--color-success)',
          }}
        >
          {isCancelledStatus
            ? 'Este ticket ha sido cancelado. No se permiten realizar modificaciones o asignaciones.'
            : 'Este ticket ya ha sido finalizado. No se permiten realizar modificaciones o asignaciones.'}
        </div>

        {resolvedMessage && (
          <div
            className="rounded-xl border p-5"
            style={{
              borderColor: isCancelledStatus
                ? 'color-mix(in srgb, var(--color-danger) 30%, transparent)'
                : 'color-mix(in srgb, var(--color-success) 30%, transparent)',
              backgroundColor: isCancelledStatus
                ? 'color-mix(in srgb, var(--color-danger) 6%, transparent)'
                : 'color-mix(in srgb, var(--color-success) 6%, transparent)',
            }}
          >
            <h4
              className="text-xs font-bold uppercase tracking-wider mb-2"
              style={{ color: isCancelledStatus ? 'var(--color-danger)' : 'var(--color-success)' }}
            >
              {isCancelledStatus ? 'Motivo de cancelación' : 'Resolución del ticket'}
            </h4>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-base)' }}>
              {resolvedMessage}
            </p>
          </div>
        )}

        {!isCancelledStatus && evidencias.length > 0 && (
          <div className="rounded-xl border p-5" style={{ borderColor: 'color-mix(in srgb, var(--color-success) 30%, transparent)', backgroundColor: 'color-mix(in srgb, var(--color-success) 6%, transparent)' }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--color-success)' }}>
              Evidencias adjuntas
            </p>
            <EvidenceGrid
              evidencias={evidencias}
              urlPrefix="/api/evidencia/admin"
              cols="two"
              thumbnailHeight="h-20"
              borderColor="color-mix(in srgb, var(--color-success) 30%, transparent)"
            />
          </div>
        )}
      </div>
    );
  }
  if (sinAsignar) {
    return (
      <div className="flex flex-col gap-5">
        <div
          className="rounded-xl border p-5 flex flex-col gap-5"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
        >

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--color-navy)' }}>
              Asignación de Responsable
            </h3>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Este ticket aún no tiene un responsable asignado. Elige cómo proceder.
            </p>
          </div>

          <div
            className="rounded-lg border p-4 flex flex-col gap-3"
            style={{
              borderColor: 'color-mix(in srgb, var(--color-primary) 35%, transparent)',
              backgroundColor: 'color-mix(in srgb, var(--color-primary) 4%, transparent)',
            }}
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-primary)' }}>
                Opción 1 — Resolver yo mismo
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                Te asignas a ti como responsable y accedes al panel de resolución directamente.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAsignarme}
              disabled={assignLoading}
              className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-5.5-2.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM10 12a5.99 5.99 0 0 0-4.793 2.39A6.483 6.483 0 0 0 10 16.5a6.483 6.483 0 0 0 4.793-2.11A5.99 5.99 0 0 0 10 12Z" clipRule="evenodd" />
              </svg>
              {assignLoading ? 'Asignando...' : `Asignarme a mí (${adminFullName})`}
            </button>
          </div>

          <div
            className="rounded-lg border p-4 flex flex-col gap-3"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-surface)',
            }}
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-navy)' }}>
                Opción 2 — Delegar a otra persona
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                Asigna el ticket a alguien más. Se generará un link dinámico para que esa persona lo resuelva.
              </p>
            </div>
            <form onSubmit={handleAsignarOtro} className="flex flex-col gap-2">
              <input
                id="otra-persona"
                type="text"
                value={otraPersona}
                onChange={e => setOtraPersona(e.target.value)}
                placeholder="Ej. Juan Pérez"
                required
                minLength={2}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-all"
                style={{ borderColor: 'var(--color-border)' }}
              />
              <button
                type="submit"
                disabled={assignLoading}
                className="w-full rounded-lg border px-4 py-2 text-sm font-semibold transition-colors hover:bg-black/5 disabled:opacity-60"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-base)' }}
              >
                {assignLoading ? 'Asignando...' : 'Asignar a otra persona'}
              </button>
            </form>
          </div>

          {assignError && (
            <p className="text-xs font-medium" style={{ color: 'var(--color-danger)' }}>
              {assignError}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (asignadoAMi) {
    return (
      <div className="flex flex-col gap-5">
        <div className="rounded-xl border p-5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <h3 className="text-sm font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-navy)' }}>
            Resolver directamente
          </h3>
          <p className="text-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>
            Cierra, cancela o actualiza el estado de la incidencia directamente desde aquí sin requerir links temporales.
          </p>

          <TicketResolutionControls
            initialStatus={ticket.status as StatusTicket}
            initialPrioridad={ticket.prioridad as Prioridad}
            initialHoldActivo={ticket.hold_activo !== null}
            initialHoldMotivo={ticket.hold_activo?.motivo ?? ''}
            initialMensajeResolucion={
              ticket.status === 'cancelado'
                ? (ticket.motivo_cancelacion ?? '')
                : (ticket.mensaje_resolucion ?? '')
            }
            initialEvidencias={initialEvidencias}
            evidenceUrlPrefix="/api/evidencia/admin"
            actions={resolveActions}
            submitLabel="Guardar resolución"
            size="sm"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleReasignar}
            disabled={reasignLoading}
            className="text-xs font-medium underline underline-offset-2 transition-opacity hover:opacity-70 disabled:opacity-40"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {reasignLoading ? 'Reasignando...' : 'Reasignar a otra persona'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl border p-5 flex flex-col gap-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-navy)' }}>
            Link Dinámico de Resolución
          </h3>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Este ticket está asignado a <strong style={{ color: 'var(--color-text-base)' }}>{ticket.responsable_nombre}</strong>. Genera y comparte el enlace temporal para que pueda resolverlo sin acceso administrativo.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {linkUrl ? (
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={linkUrl}
                    className="flex-1 rounded-lg border px-3 py-2 text-xs font-mono select-all outline-none"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'color-mix(in srgb, var(--color-navy) 2%, transparent)' }}
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="rounded-lg border px-3 py-2 text-xs font-semibold transition-colors hover:bg-black/5 flex items-center gap-1.5 shrink-0"
                    style={{
                      borderColor: copied ? 'var(--color-success)' : 'var(--color-border)',
                      color: copied ? 'var(--color-success)' : 'var(--color-text-base)',
                      backgroundColor: copied ? 'color-mix(in srgb, var(--color-success) 8%, transparent)' : 'transparent',
                    }}
                  >
                    {copied ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                          <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                        </svg>
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
                {copyError && (
                  <p className="text-xs font-medium text-red-600 dark:text-red-400">
                    No se pudo copiar, selecciona el texto manualmente
                  </p>
                )}
              </div>

              {linkWarn && (
                <div
                  className="flex items-start gap-2 rounded-lg border px-3 py-2 text-xs"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--color-warning) 8%, transparent)',
                    borderColor: 'color-mix(in srgb, var(--color-warning) 30%, transparent)',
                    color: 'var(--color-warning)',
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true">
                    <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                  </svg>
                  <span>El link anterior ha sido invalidado automáticamente al generar este nuevo enlace.</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs italic" style={{ color: 'var(--color-text-muted)' }}>
              No se ha generado ningún link activo para este ticket.
            </p>
          )}

          <div>
            <button
              type="button"
              onClick={handleGenerateLink}
              disabled={linkLoading}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: 'var(--color-navy)' }}
            >
              {linkLoading
                ? 'Generando...'
                : linkUrl
                  ? 'Regenerar link (invalida el anterior)'
                  : 'Generar link de resolución'}
            </button>
          </div>

          {linkError && (
            <p className="mt-1 text-xs font-medium" style={{ color: 'var(--color-danger)' }}>
              {linkError}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleReasignar}
          disabled={reasignLoading}
          className="text-xs font-medium underline underline-offset-2 transition-opacity hover:opacity-70 disabled:opacity-40"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {reasignLoading ? 'Reasignando...' : 'Reasignar'}
        </button>
      </div>
    </div>
  );
}
