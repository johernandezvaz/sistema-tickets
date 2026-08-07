'use client';

import { useState } from 'react';
import { loginAction } from '@/app/admin/actions/auth';

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await loginAction(new FormData(e.currentTarget));
      if (result && !result.ok) setError(result.error);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">

      {error && (
        <div
          className="flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-danger) 7%, transparent)',
            borderColor: 'color-mix(in srgb, var(--color-danger) 30%, transparent)',
            color: 'var(--color-danger)',
          }}
          role="alert"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
            className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-.75-4.75a.75.75 0 0 0 1.5 0v-4.5a.75.75 0 0 0-1.5 0v4.5zm.75-7.25a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium"
          style={{ color: 'var(--color-text-base)' }}>
          Correo electrónico
        </label>
        <input
          id="email" name="email" type="email" autoComplete="email"
          required placeholder="usuario@safe-demo.com"
          className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-all"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: '#fff',
            color: 'var(--color-text-base)',
          }}
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium"
          style={{ color: 'var(--color-text-base)' }}>
          Contraseña
        </label>
        <input
          id="password" name="password" type="password" autoComplete="current-password"
          required placeholder="••••••••"
          className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-all"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: '#fff',
            color: 'var(--color-text-base)',
          }}
        />
      </div>

      <button
        type="submit" disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg px-6 py-2.5
                   text-sm font-semibold text-white transition-opacity
                   disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        {loading ? (
          <>
            <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg"
              fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Ingresando…
          </>
        ) : 'Ingresar'}
      </button>

    </form>
  );
}
