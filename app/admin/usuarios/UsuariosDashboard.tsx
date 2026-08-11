'use client';

import { useState } from 'react';
import { crearUsuarioAction, resetearPasswordAction } from '@/app/admin/actions/superadmin';
import type { Area } from '@/lib/types';
import type { UsuarioDetalle } from '@/lib/admin';
import { copyToClipboard } from '@/lib/clipboard';

interface UsuariosDashboardProps {
  initialUsuarios: UsuarioDetalle[];
  areas: Area[];
}

export default function UsuariosDashboard({ initialUsuarios, areas }: UsuariosDashboardProps) {
  const [usuarios, setUsuarios] = useState(initialUsuarios);

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [areaId, setAreaId] = useState('none');

  const [createLoading, setCreateLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  const [passwordDisplay, setPasswordDisplay] = useState<{
    email: string;
    pass: string;
    isReset: boolean;
  } | null>(null);

  const [resetLoadingId, setResetLoadingId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  function handleClosePasswordModal() {
    const isReset = passwordDisplay?.isReset;
    setPasswordDisplay(null);
    setCopyError(false);
    if (!isReset) {
      window.location.reload();
    }
  }

  async function handleCopyPassword() {
    if (passwordDisplay) {
      setCopyError(false);
      const success = await copyToClipboard(passwordDisplay.pass);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        setCopyError(true);
      }
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setGlobalError(null);
    setPasswordDisplay(null);
    setCreateLoading(true);

    const formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('apellido', apellido);
    formData.append('email', email);
    formData.append('area_id', areaId);

    try {
      const res = await crearUsuarioAction(formData);
      if (res.ok && res.passwordTemp) {
        setPasswordDisplay({
          email: email.trim().toLowerCase(),
          pass: res.passwordTemp,
          isReset: false,
        });

        setNombre('');
        setApellido('');
        setEmail('');
        setAreaId('none');
      } else {
        if (res.fieldErrors) {
          setErrors(res.fieldErrors);
        } else {
          setGlobalError(res.error ?? 'Ocurrió un error al crear el usuario.');
        }
      }
    } catch {
      setGlobalError('Error de red al intentar crear el usuario.');
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleResetPassword(id: number, userEmail: string) {
    const confirmed = window.confirm(`¿Estás seguro de que deseas restablecer la contraseña de ${userEmail}?`);
    if (!confirmed) return;

    setResetLoadingId(id);
    setGlobalError(null);
    setPasswordDisplay(null);

    try {
      const res = await resetearPasswordAction(id);
      if (res.ok && res.passwordTemp) {
        setPasswordDisplay({
          email: userEmail,
          pass: res.passwordTemp,
          isReset: true,
        });

        setUsuarios(prev =>
          prev.map(u => (u.id === id ? { ...u, must_change_password: true } : u))
        );
      } else {
        setGlobalError(res.error ?? 'No se pudo restablecer la contraseña.');
      }
    } catch {
      setGlobalError('Error de conexión al intentar restablecer la contraseña.');
    } finally {
      setResetLoadingId(null);
    }
  }

  const inputStyle = (hasErr?: string): React.CSSProperties => ({
    width: '100%',
    borderRadius: '0.5rem',
    border: `1px solid ${hasErr ? 'var(--color-danger)' : 'var(--color-border)'}`,
    backgroundColor: '#fff',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    color: 'var(--color-text-base)',
    outline: 'none',
  });

  const selectStyle: React.CSSProperties = {
    width: '100%',
    borderRadius: '0.5rem',
    border: '1px solid var(--color-border)',
    backgroundColor: '#fff',
    padding: '0.5rem 2rem 0.5rem 0.75rem',
    fontSize: '0.875rem',
    color: 'var(--color-text-base)',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b7280'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06z' clip-rule='evenodd'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 0.5rem center',
    backgroundSize: '1rem',
    outline: 'none',
  };

  return (
    <div className="flex flex-col gap-6">

      {passwordDisplay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-md rounded-xl border p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-200 shadow-xl"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div className="flex items-start gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth={2.2} className="h-6 w-6 shrink-0 mt-0.5"
                style={{ color: 'var(--color-success)' }} aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <h4 className="text-base font-bold" style={{ color: 'var(--color-navy)' }}>
                  {passwordDisplay.isReset ? 'Nueva contraseña temporal' : 'Administrador creado exitosamente'}
                </h4>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  Se ha generado la siguiente contraseña temporal para el usuario <strong>{passwordDisplay.email}</strong>.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 rounded-lg border p-3" style={{ backgroundColor: 'color-mix(in srgb, var(--color-success) 4%, transparent)', borderColor: 'color-mix(in srgb, var(--color-success) 20%, transparent)' }}>
                <span className="flex-1 font-mono text-lg font-bold tracking-wider select-all" style={{ color: 'var(--color-success)' }}>
                  {passwordDisplay.pass}
                </span>
                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-black/5 transition-colors shrink-0 flex items-center gap-1.5"
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

            <div className="flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-xs" style={{ backgroundColor: 'color-mix(in srgb, var(--color-warning) 8%, transparent)', borderColor: 'color-mix(in srgb, var(--color-warning) 30%, transparent)', color: 'var(--color-warning)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4.5 w-4.5 shrink-0 mt-0.5" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
              </svg>
              <span>
                <strong>Atención:</strong> Esta contraseña no podrá verse de nuevo. Cópiala o compártela con el usuario antes de cerrar esta ventana.
              </span>
            </div>

            <button
              type="button"
              onClick={handleClosePasswordModal}
              className="mt-2 w-full rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Ya guardé la contraseña, cerrar
            </button>
          </div>
        </div>
      )}

      {globalError && (
        <div
          className="rounded-lg border px-4 py-3 text-sm flex items-start gap-2.5"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-danger) 8%, transparent)',
            borderColor: 'color-mix(in srgb, var(--color-danger) 25%, transparent)',
            color: 'var(--color-danger)',
          }}
          role="alert"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
          </svg>
          <span>{globalError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        <div className="card lg:col-span-1">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--color-navy)' }}>
            Nuevo Administrador
          </h2>

          <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
            <div>
              <label htmlFor="nombre" className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>
                Nombre
              </label>
              <input
                id="nombre"
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Ej. Juan"
                required
                style={inputStyle(errors.nombre)}
              />
              {errors.nombre && <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>{errors.nombre}</p>}
            </div>

            <div>
              <label htmlFor="apellido" className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>
                Apellido
              </label>
              <input
                id="apellido"
                type="text"
                value={apellido}
                onChange={e => setApellido(e.target.value)}
                placeholder="Ej. Pérez"
                required
                style={inputStyle(errors.apellido)}
              />
              {errors.apellido && <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>{errors.apellido}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>
                Correo corporativo
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="usuario@safe-demo.com"
                required
                style={inputStyle(errors.email)}
              />
              {errors.email && <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="area_id" className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>
                Área asignada
              </label>
              <select
                id="area_id"
                value={areaId}
                onChange={e => setAreaId(e.target.value)}
                style={selectStyle}
              >
                <option value="none">Sin área asignada (General)</option>
                {areas.map(area => (
                  <option key={area.id} value={area.id}>
                    {area.nombre}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={createLoading}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {createLoading ? 'Creando...' : 'Crear administrador'}
            </button>
          </form>
        </div>

        <div className="card lg:col-span-2 flex flex-col gap-4">
          <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--color-navy)' }}>
            Cuentas Registradas
          </h2>

          <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--color-border)' }}>
            <table className="w-full text-left text-sm" style={{ backgroundColor: 'var(--color-surface)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'color-mix(in srgb, var(--color-navy) 4%, transparent)' }}>
                  {['Usuario', 'Rol', 'Área', 'Contraseña', 'Acción'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-navy)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u, i) => (
                  <tr
                    key={u.id}
                    style={{
                      borderBottom: i < usuarios.length - 1 ? '1px solid var(--color-border)' : undefined,
                    }}
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold" style={{ color: 'var(--color-text-base)' }}>
                        {u.nombre} {u.apellido}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {u.email}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: u.rol === 'superadmin' ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                        {u.rol}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-base)' }}>
                      {u.area_nombre ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      {u.must_change_password ? (
                        <span
                          className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold"
                          style={{
                            backgroundColor: 'color-mix(in srgb, var(--color-warning) 12%, transparent)',
                            color: 'var(--color-warning)',
                          }}
                        >
                          Pendiente de cambio
                        </span>
                      ) : (
                        <span
                          className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold"
                          style={{
                            backgroundColor: 'color-mix(in srgb, var(--color-success) 12%, transparent)',
                            color: 'var(--color-success)',
                          }}
                        >
                          Establecida
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleResetPassword(u.id, u.email)}
                        disabled={resetLoadingId === u.id}
                        className="rounded border px-2 py-1 text-xs font-semibold transition-all hover:bg-black/5 disabled:opacity-60"
                        style={{
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-navy)',
                          backgroundColor: '#fff',
                        }}
                      >
                        {resetLoadingId === u.id ? 'Restableciendo...' : 'Restablecer'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
