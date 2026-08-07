'use client';

import { useState } from 'react';
import { changePasswordAction } from '@/app/admin/actions/auth';

interface Errors { nueva?: string; confirmar?: string; _global?: string }

export default function ChangePasswordForm() {
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const result = await changePasswordAction(new FormData(e.currentTarget));
      if (result && !result.ok) setErrors(result.errors);
    } catch {
      // redirect() 
    } finally {
      setLoading(false);
    }
  }

  function FieldError({ msg }: { msg?: string }) {
    if (!msg) return null;
    return (
      <p className="mt-1 text-xs font-medium" style={{ color: 'var(--color-danger)' }} role="alert">
        {msg}
      </p>
    );
  }

  const inputStyle = (hasErr?: string): React.CSSProperties => ({
    width: '100%',
    borderRadius: '0.5rem',
    border: `1px solid ${hasErr ? 'var(--color-danger)' : 'var(--color-border)'}`,
    backgroundColor: '#fff',
    padding: '0.625rem 0.875rem',
    fontSize: '0.9375rem',
    color: 'var(--color-text-base)',
    outline: 'none',
  });

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">

      <div
        className="rounded-lg border px-4 py-3 text-sm"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--color-primary) 7%, transparent)',
          borderColor: 'color-mix(in srgb, var(--color-primary) 25%, transparent)',
          color: 'var(--color-primary)',
        }}
      >
        <p className="font-semibold">Primer ingreso detectado</p>
        <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Por seguridad debes establecer una nueva contraseña antes de continuar.
          Mínimo 8 caracteres e incluir al menos un número.
        </p>
      </div>

      {errors._global && (
        <p className="text-sm" style={{ color: 'var(--color-danger)' }} role="alert">
          {errors._global}
        </p>
      )}

      <div>
        <label htmlFor="nueva" className="mb-1.5 block text-sm font-medium"
          style={{ color: 'var(--color-text-base)' }}>
          Nueva contraseña
        </label>
        <input id="nueva" name="nueva" type="password" autoComplete="new-password"
          placeholder="Mínimo 8 caracteres con un número" style={inputStyle(errors.nueva)} />
        <FieldError msg={errors.nueva} />
      </div>

      <div>
        <label htmlFor="confirmar" className="mb-1.5 block text-sm font-medium"
          style={{ color: 'var(--color-text-base)' }}>
          Confirmar contraseña
        </label>
        <input id="confirmar" name="confirmar" type="password" autoComplete="new-password"
          placeholder="Repite la contraseña" style={inputStyle(errors.confirmar)} />
        <FieldError msg={errors.confirmar} />
      </div>

      <button
        type="submit" disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg px-6 py-2.5
                   text-sm font-semibold text-white transition-opacity
                   disabled:opacity-60 hover:opacity-90"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        {loading ? (
          <>
            <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg"
              fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Guardando…
          </>
        ) : 'Establecer contraseña'}
      </button>

    </form>
  );
}
