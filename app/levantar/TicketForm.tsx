'use client';

import { useState } from 'react';
import { submitTicket } from '@/app/actions/tickets';
import { sendTicketReceivedEmail, sendTicketAdminEmail } from '@/lib/emailjs';
import type { Area, Prioridad, TicketFormErrors } from '@/lib/types';
import ConfirmacionTicket from './ConfirmacionTicket';

interface TicketFormProps {
  areas: Area[];
}


function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--color-danger)' }} role="alert">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
        <path fillRule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14zm0-10a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 5zm0 7.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" clipRule="evenodd" />
      </svg>
      {message}
    </p>
  );
}

const inputBase: React.CSSProperties = {
  width: '100%',
  borderRadius: '0.5rem',
  border: '1px solid var(--color-border)',
  backgroundColor: '#fff',
  padding: '0.625rem 0.875rem',
  fontSize: '0.9375rem',
  color: 'var(--color-text-base)',
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

const inputError: React.CSSProperties = {
  borderColor: 'var(--color-danger)',
  boxShadow: '0 0 0 3px color-mix(in srgb, var(--color-danger) 15%, transparent)',
};

const PRIORIDADES: { value: Prioridad; label: string; desc: string }[] = [
  { value: 'baja', label: 'Baja', desc: 'No bloquea el trabajo' },
  { value: 'media', label: 'Media', desc: 'Afecta parcialmente' },
  { value: 'alta', label: 'Alta', desc: 'Bloquea operaciones' },
];

export default function TicketForm({ areas }: TicketFormProps) {
  const [errors, setErrors] = useState<TicketFormErrors>({});
  const [isPending, setIsPending] = useState(false);
  const [confirmacion, setConfirmacion] = useState<{
    folio: string;
    nombre: string;
    apellido: string;
    email: string;
    areaNombre: string;
    areaOrigenNombre: string;
  } | null>(null);

  if (confirmacion) {
    return (
      <ConfirmacionTicket
        folio={confirmacion.folio}
        nombre={confirmacion.nombre}
        email={confirmacion.email}
      />
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setIsPending(true);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await submitTicket(formData);

      if (result.ok) {
        setConfirmacion({
          folio: result.folio,
          nombre: result.nombre,
          apellido: result.apellido,
          email: result.email,
          areaNombre: result.areaNombre,
          areaOrigenNombre: result.areaOrigenNombre,
        });

        sendTicketReceivedEmail({
          nombre:          result.nombre,
          apellido:        result.apellido,
          email:           result.email,
          areaNombre:      result.areaNombre,
          areaOrigenNombre: result.areaOrigenNombre,
          folio:           result.folio,
        }).catch((emailErr) => {
          console.warn('[EmailJS] No se pudo enviar el correo de confirmación:', emailErr);
        });

        // Notificar a los admins del área destino (fire-and-forget)
        sendTicketAdminEmail(
          {
            nombre:      result.nombre,
            apellido:    result.apellido,
            email:       result.email,
            areaOrigen:  result.areaOrigenNombre,
            areaDestino: result.areaNombre,
            folio:       result.folio,
            prioridad:   result.prioridad,
          },
          result.adminEmails
        ).catch((adminErr) => {
          console.warn('[EmailJS] No se pudo enviar la notificación al admin:', adminErr);
        });
      } else {
        setErrors(result.errors);

        const firstErrField = Object.keys(result.errors)[0];
        document.getElementById(firstErrField)?.focus();
      }
    } catch {
      setErrors({ _global: 'Error de conexión. Intenta de nuevo en unos momentos.' });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">

      {errors._global && (
        <div
          className="rounded-lg border px-4 py-3 text-sm"
          style={{
            borderColor: 'color-mix(in srgb, var(--color-danger) 35%, transparent)',
            backgroundColor: 'color-mix(in srgb, var(--color-danger) 8%, transparent)',
            color: 'var(--color-danger)',
          }}
          role="alert"
        >
          {errors._global}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="nombre" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--color-text-base)' }}>
            Nombre <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            autoComplete="given-name"
            placeholder="Ej. María"
            style={{ ...inputBase, ...(errors.nombre ? inputError : {}) }}
            aria-invalid={!!errors.nombre}
            aria-describedby={errors.nombre ? 'nombre-error' : undefined}
          />
          <FieldError message={errors.nombre} />
        </div>

        <div>
          <label htmlFor="apellido" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--color-text-base)' }}>
            Apellido <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <input
            id="apellido"
            name="apellido"
            type="text"
            autoComplete="family-name"
            placeholder="Ej. González"
            style={{ ...inputBase, ...(errors.apellido ? inputError : {}) }}
            aria-invalid={!!errors.apellido}
            aria-describedby={errors.apellido ? 'apellido-error' : undefined}
          />
          <FieldError message={errors.apellido} />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--color-text-base)' }}>
          Correo corporativo <span style={{ color: 'var(--color-danger)' }}>*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="usuario@safe-demo.com"
          style={{ ...inputBase, ...(errors.email ? inputError : {}) }}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        <FieldError message={errors.email} />
      </div>

      <div>
        <label htmlFor="area_origen_id" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--color-text-base)' }}>
          Área del solicitante <span style={{ color: 'var(--color-danger)' }}>*</span>
        </label>
        <select
          id="area_origen_id"
          name="area_origen_id"
          defaultValue=""
          style={{
            ...inputBase,
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b7280'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06z' clip-rule='evenodd'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 0.75rem center',
            backgroundSize: '1.25rem',
            paddingRight: '2.5rem',
            ...(errors.area_origen_id ? inputError : {}),
          }}
          aria-invalid={!!errors.area_origen_id}
        >
          <option value="" disabled>
            {areas.length === 0 ? 'Sin áreas disponibles' : 'Selecciona tu área…'}
          </option>
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.nombre}
            </option>
          ))}
        </select>
        <FieldError message={errors.area_origen_id} />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium" style={{ color: 'var(--color-text-base)' }}>
          Prioridad <span style={{ color: 'var(--color-danger)' }}>*</span>
        </legend>
        <div className="grid grid-cols-3 gap-3">
          {PRIORIDADES.map(({ value, label, desc }) => (
            <label
              key={value}
              className="relative flex cursor-pointer flex-col gap-0.5 rounded-lg border p-3
                         transition-all hover:border-current has-[:checked]:shadow-sm"
              style={{
                borderColor: 'var(--color-border)',
              }}
            >
              <input
                type="radio"
                name="prioridad"
                value={value}
                className="sr-only"
              />
              <span className="text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>
                {label}
              </span>
              <span className="text-xs leading-tight" style={{ color: 'var(--color-text-muted)' }}>
                {desc}
              </span>

              <style>{`
                label:has(input[value="${value}"]:checked) {
                  border-color: var(--color-primary);
                  background-color: color-mix(in srgb, var(--color-primary) 6%, transparent);
                }
              `}</style>
            </label>
          ))}
        </div>
        <FieldError message={errors.prioridad} />
      </fieldset>
      <div>
        <label htmlFor="area_id" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--color-text-base)' }}>
          Área destino <span style={{ color: 'var(--color-danger)' }}>*</span>
        </label>
        <select
          id="area_id"
          name="area_id"
          defaultValue=""
          style={{
            ...inputBase,
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b7280'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06z' clip-rule='evenodd'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 0.75rem center',
            backgroundSize: '1.25rem',
            paddingRight: '2.5rem',
            ...(errors.area_id ? inputError : {}),
          }}
          aria-invalid={!!errors.area_id}
        >
          <option value="" disabled>
            {areas.length === 0 ? 'Sin áreas disponibles' : 'Selecciona el área que resolverá el ticket…'}
          </option>
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.nombre}
            </option>
          ))}
        </select>
        {areas.length === 0 && (
          <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Las áreas se configuran desde el panel administrativo.
          </p>
        )}
        <FieldError message={errors.area_id} />
      </div>

      <div>
        <label htmlFor="mensaje" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--color-text-base)' }}>
          Descripción del problema <span style={{ color: 'var(--color-danger)' }}>*</span>
        </label>
        <textarea
          id="mensaje"
          name="mensaje"
          rows={5}
          placeholder="Describe el problema con el mayor detalle posible…"
          style={{ ...inputBase, resize: 'vertical', ...(errors.mensaje ? inputError : {}) }}
          aria-invalid={!!errors.mensaje}
        />
        <FieldError message={errors.mensaje} />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3
                   text-sm font-semibold text-white transition-opacity
                   disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        {isPending ? (
          <>
            <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Registrando ticket…
          </>
        ) : (
          'Enviar ticket'
        )}
      </button>

    </form>
  );
}
