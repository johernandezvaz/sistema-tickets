'use client';

import { useState, useCallback } from 'react';
import type { TicketEvidencia, StatusTicket } from '@/lib/types';
import EvidenceGrid from './EvidenceGrid';


export interface ResolutionActions {
  uploadEvidence: (formData: FormData) => Promise<{ ok: boolean; evidencia?: TicketEvidencia; error?: string }>;
  submitResolution: (formData: FormData) => Promise<{ ok: boolean; error?: string; fieldErrors?: Record<string, string> }>;
}

interface TicketResolutionControlsProps {
  ticketId?: number | string;
  initialStatus: StatusTicket;
  initialHoldActivo: boolean;
  initialHoldMotivo: string;
  initialMensajeResolucion: string;
  initialEvidencias: TicketEvidencia[];
  evidenceUrlPrefix: string;
  actions: ResolutionActions;
  onSuccess?: () => void;
  submitLabel?: string;
  size?: 'sm' | 'md';
}

const STATUS_OPTIONS: { value: StatusTicket; label: string; color: string }[] = [
  { value: 'en_proceso', label: 'En proceso', color: 'var(--color-primary)' },
  { value: 'finalizado', label: 'Finalizar', color: 'var(--color-success)' },
  { value: 'cancelado', label: 'Cancelar', color: 'var(--color-danger)' },
];

export default function TicketResolutionControls({
  initialStatus,
  initialHoldActivo,
  initialHoldMotivo,
  initialMensajeResolucion,
  initialEvidencias,
  evidenceUrlPrefix,
  actions,
  onSuccess,
  submitLabel = 'Guardar cambios',
  size = 'md',
}: TicketResolutionControlsProps) {
  const [status, setStatus] = useState<StatusTicket>(initialStatus);
  const [holdActivo, setHoldActivo] = useState(initialHoldActivo);
  const [holdMotivo, setHoldMotivo] = useState(initialHoldMotivo);
  const [mensajeResolucion, setMensajeResolucion] = useState(initialMensajeResolucion);
  const [evidencias, setEvidencias] = useState<TicketEvidencia[]>(initialEvidencias);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [updatePending, setUpdatePending] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);

  const markDirty = useCallback(() => {
    setIsDirty(true);
    setUpdateSuccess(false);
  }, []);

  function handleStatusChange(next: StatusTicket) {
    markDirty();
    setStatus(next);
    if (next !== 'en_proceso') {
      setHoldActivo(false);
    }
  }

  function handleHoldChange(checked: boolean) {
    markDirty();
    setHoldActivo(checked);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploading(true);

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('El archivo excede el límite permitido de 5MB.');
      setUploading(false);
      e.target.value = '';
      return;
    }
    if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
      setUploadError('Formato inválido. Solo se permiten imágenes JPG o PNG.');
      setUploading(false);
      e.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await actions.uploadEvidence(formData);
      if (res.ok && res.evidencia) {
        setEvidencias(prev => [...prev, res.evidencia!]);
        markDirty();
      } else {
        setUploadError(res.error ?? 'Error al subir el archivo.');
      }
    } catch {
      setUploadError('Error de red al subir la evidencia.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUpdateError(null);
    setFieldErrors({});
    setUpdateSuccess(false);

    const errors: Record<string, string> = {};

    if (holdActivo && !holdMotivo.trim()) {
      errors.hold_motivo = 'Debes ingresar un motivo para marcar el ticket en espera.';
    }

    if (status === 'finalizado') {
      if (!mensajeResolucion.trim()) {
        errors.mensaje_resolucion = 'El mensaje de resolución es obligatorio para finalizar el ticket.';
      } else if (mensajeResolucion.trim().length < 10) {
        errors.mensaje_resolucion = 'El mensaje de resolución debe tener al menos 10 caracteres.';
      }
      if (evidencias.length === 0) {
        setUpdateError('No se puede finalizar el ticket sin adjuntar al menos una imagen de evidencia.');
        return;
      }
    }

    if (status === 'cancelado') {
      if (!mensajeResolucion.trim()) {
        errors.mensaje_resolucion = 'El motivo de cancelación es obligatorio para cancelar el ticket.';
      } else if (mensajeResolucion.trim().length < 10) {
        errors.mensaje_resolucion = 'El motivo de cancelación debe tener al menos 10 caracteres.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setUpdatePending(true);

    const formData = new FormData();
    formData.append('status', status);
    formData.append('mensaje_resolucion', mensajeResolucion);
    formData.append('hold_activo', String(holdActivo));
    formData.append('hold_motivo', holdMotivo);

    try {
      const res = await actions.submitResolution(formData);
      if (res.ok) {
        setUpdateSuccess(true);
        setIsDirty(false);
        onSuccess?.();
      } else {
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors);
        } else {
          setUpdateError(res.error ?? 'Error al guardar la resolución.');
        }
      }
    } catch {
      setUpdateError('Error de red al guardar la resolución.');
    } finally {
      setUpdatePending(false);
    }
  }

  const isSmall = size === 'sm';
  const inputClass = isSmall
    ? 'w-full rounded-lg border px-3 py-1.5 text-xs outline-none bg-white resize-none'
    : 'w-full rounded-lg border px-3 py-2 text-sm outline-none bg-white resize-none';
  const labelClass = isSmall
    ? 'block text-[10px] font-semibold mb-1'
    : 'block text-xs font-semibold mb-1';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

      <div>
        <span className={labelClass} style={{ color: 'var(--color-text-muted)' }}>
          Estado
        </span>
        <div className="grid grid-cols-3 gap-2">
          {STATUS_OPTIONS.map(opt => {
            const active = status === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleStatusChange(opt.value)}
                className="rounded-lg border px-2 py-2 text-xs font-semibold transition-all"
                style={active
                  ? {
                    backgroundColor: opt.color,
                    borderColor: opt.color,
                    color: '#fff',
                  }
                  : {
                    backgroundColor: 'transparent',
                    borderColor: opt.color,
                    color: opt.color,
                  }
                }
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {status === 'finalizado' && (
        <div className="rounded-lg border p-3" style={{ borderColor: 'var(--color-border)', backgroundColor: '#fff' }}>
          <span className={labelClass} style={{ color: 'var(--color-text-muted)' }}>
            Evidencias adjuntas <span style={{ color: 'var(--color-danger)' }}>*</span>
            <span className="font-normal"> (JPG, PNG — máx 5MB)</span>
          </span>

          {evidencias.length > 0 && (
            <div className="mb-3">
              <EvidenceGrid
                evidencias={evidencias}
                urlPrefix={evidenceUrlPrefix}
                cols="two"
                thumbnailHeight="h-16"
                borderColor="var(--color-border)"
              />
            </div>
          )}

          <input
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
            id="resolution-file-upload"
          />
          <label
            htmlFor="resolution-file-upload"
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-black/5 transition-colors"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-base)' }}
          >
            {uploading ? (
              <>
                <svg className="h-3.5 w-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Subiendo...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
                  <path fillRule="evenodd" d="M15.621 4.379a3 3 0 0 0-4.242 0l-7 7a3 3 0 0 0 4.241 4.243h.001l.497-.5a.75.75 0 0 1 1.064 1.057l-.498.501-.002.002a4.5 4.5 0 0 1-6.364-6.364l7-7a4.5 4.5 0 0 1 6.368 6.36l-3.455 3.553A2.625 2.625 0 1 1 9.52 5.52l3.45-3.45a.75.75 0 1 1 1.061 1.06l-3.45 3.45a1.125 1.125 0 1 0 1.59 1.59l3.45-3.553a3 3 0 0 0 0-4.242Z" clipRule="evenodd" />
                </svg>
                Adjuntar imagen
              </>
            )}
          </label>

          {uploadError && (
            <p className="mt-2 text-xs font-semibold" style={{ color: 'var(--color-danger)' }}>
              {uploadError}
            </p>
          )}
        </div>
      )}

      {status === 'en_proceso' && (
        <div className="rounded-lg border p-3 bg-white" style={{ borderColor: 'var(--color-border)' }}>
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold" style={{ color: 'var(--color-text-base)' }}>
            <input
              type="checkbox"
              checked={holdActivo}
              onChange={e => handleHoldChange(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            Marcar &quot;En espera de tercero&quot;
          </label>

          {holdActivo && (
            <div className="mt-2.5">
              <label htmlFor="hold-motivo" className="mb-1 block text-[10px] font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                Motivo de la espera <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <textarea
                id="hold-motivo"
                rows={2}
                value={holdMotivo}
                onChange={e => { setHoldMotivo(e.target.value); markDirty(); }}
                placeholder="Ej. Esperando que el usuario verifique la conexión."
                className={inputClass}
                style={{ borderColor: 'var(--color-border)' }}
              />
              {fieldErrors.hold_motivo && (
                <p className="mt-1 text-[10px] font-semibold" style={{ color: 'var(--color-danger)' }}>
                  {fieldErrors.hold_motivo}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div>
        <label htmlFor="mensaje-resolucion" className={labelClass} style={{ color: 'var(--color-text-muted)' }}>
          {status === 'cancelado' ? 'Motivo de cancelación' : 'Mensaje de resolución'}
          {(status === 'finalizado' || status === 'cancelado') && <span style={{ color: 'var(--color-danger)' }}> *</span>}
        </label>
        <textarea
          id="mensaje-resolucion"
          rows={isSmall ? 3 : 4}
          value={mensajeResolucion}
          onChange={e => { setMensajeResolucion(e.target.value); markDirty(); }}
          placeholder={status === 'finalizado'
            ? 'Describe la solución aplicada (mín. 10 caracteres)...'
            : status === 'cancelado'
              ? 'Describe el motivo detallado de la cancelación (mín. 10 caracteres)...'
              : 'Detalle o avance opcional...'
          }
          className={inputClass}
          style={{ borderColor: 'var(--color-border)' }}
        />
        {fieldErrors.mensaje_resolucion && (
          <p className="mt-1 text-[10px] font-semibold" style={{ color: 'var(--color-danger)' }}>
            {fieldErrors.mensaje_resolucion}
          </p>
        )}
      </div>

      {updateError && (
        <p className="text-xs font-semibold" style={{ color: 'var(--color-danger)' }}>
          {updateError}
        </p>
      )}

      {updateSuccess && (
        <div
          className="rounded-lg border px-3 py-2 text-xs flex items-center gap-2"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-success) 8%, transparent)',
            borderColor: 'color-mix(in srgb, var(--color-success) 30%, transparent)',
            color: 'var(--color-success)',
          }}
          role="status"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5z" clipRule="evenodd" />
          </svg>
          <span className="font-semibold">Cambios guardados correctamente.</span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={updatePending}
          className="flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: 'var(--color-navy)' }}
        >
          {updatePending ? 'Guardando...' : submitLabel}
        </button>

        {isDirty && !updateSuccess && (
          <span
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-warning) 12%, transparent)',
              color: 'var(--color-warning)',
              border: '1px solid color-mix(in srgb, var(--color-warning) 30%, transparent)',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-2.5 w-2.5" aria-hidden="true">
              <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
              <path fillRule="evenodd" d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1ZM2 8a6 6 0 1 1 12 0A6 6 0 0 1 2 8Z" clipRule="evenodd" />
            </svg>
            Sin guardar
          </span>
        )}
      </div>

    </form>
  );
}
