'use client';

import { useState } from 'react';
import { crearAreaAction, toggleAreaAction } from '@/app/admin/actions/superadmin';
import type { Area } from '@/lib/types';

interface AreasDashboardProps {
  initialAreas: (Area & { activo: boolean; creado_en: string })[];
}

export default function AreasDashboard({ initialAreas }: AreasDashboardProps) {
  const [areas, setAreas] = useState(initialAreas);
  const [nombre, setNombre] = useState('');

  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState(false);

  const [toggleLoadingId, setToggleLoadingId] = useState<number | null>(null);

  async function handleAddArea(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    setAddSuccess(false);

    const val = nombre.trim();
    if (!val) return;

    setAddLoading(true);

    const formData = new FormData();
    formData.append('nombre', val);

    try {
      const res = await crearAreaAction(formData);
      if (res.ok) {
        setAddSuccess(true);
        setNombre('');
        window.location.reload();
      } else {
        setAddError(res.error ?? 'Error al crear el área.');
      }
    } catch {
      setAddError('Error de red al crear el área.');
    } finally {
      setAddLoading(false);
    }
  }

  async function handleToggleArea(id: number, currentActivo: boolean) {
    setToggleLoadingId(id);
    try {
      const res = await toggleAreaAction(id, !currentActivo);
      if (res.ok) {
        setAreas(prev =>
          prev.map(a => (a.id === id ? { ...a, activo: !currentActivo } : a))
        );
      } else {
        alert(res.error ?? 'No se pudo cambiar el estado del área.');
      }
    } catch {
      alert('Error de conexión al cambiar el estado del área.');
    } finally {
      setToggleLoadingId(null);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    borderRadius: '0.5rem',
    border: '1px solid var(--color-border)',
    backgroundColor: '#fff',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    color: 'var(--color-text-base)',
    outline: 'none',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <div className="card lg:col-span-1">
        <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--color-navy)' }}>
          Nueva Área
        </h2>

        <form onSubmit={handleAddArea} className="flex flex-col gap-4">
          <div>
            <label htmlFor="nombre" className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>
              Nombre de la nueva área
            </label>
            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej. Recursos Humanos"
              required
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={addLoading}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {addLoading ? 'Creando...' : 'Crear área'}
          </button>
        </form>

        {addError && (
          <p className="mt-3 text-xs font-semibold" style={{ color: 'var(--color-danger)' }}>
            {addError}
          </p>
        )}
        {addSuccess && (
          <p className="mt-3 text-xs font-semibold" style={{ color: 'var(--color-success)' }}>
            Área creada correctamente.
          </p>
        )}
      </div>

      <div className="card lg:col-span-2 flex flex-col gap-4">
        <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--color-navy)' }}>
          Áreas Existentes
        </h2>

        {areas.length === 0 ? (
          <div className="text-center py-8 text-sm italic" style={{ color: 'var(--color-text-muted)' }}>
            No hay áreas registradas en el sistema.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--color-border)' }}>
            <table className="w-full text-left text-sm" style={{ backgroundColor: 'var(--color-surface)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'color-mix(in srgb, var(--color-navy) 4%, transparent)' }}>
                  <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-navy)' }}>ID</th>
                  <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-navy)' }}>Nombre</th>
                  <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-navy)' }}>Estado</th>
                  <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-navy)' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {areas.map((area, i) => (
                  <tr
                    key={area.id}
                    style={{
                      borderBottom: i < areas.length - 1 ? '1px solid var(--color-border)' : undefined,
                    }}
                  >
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {area.id}
                    </td>
                    <td className="px-4 py-3 font-semibold" style={{ color: 'var(--color-text-base)' }}>
                      {area.nombre}
                    </td>
                    <td className="px-4 py-3">
                      {area.activo ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                          style={{
                            backgroundColor: 'color-mix(in srgb, var(--color-success) 12%, transparent)',
                            color: 'var(--color-success)',
                          }}
                        >
                          Activa
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                          style={{
                            backgroundColor: 'color-mix(in srgb, var(--color-danger) 10%, transparent)',
                            color: 'var(--color-danger)',
                          }}
                        >
                          Inactiva
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleToggleArea(area.id, area.activo)}
                        disabled={toggleLoadingId === area.id}
                        className="rounded px-2.5 py-1 text-xs font-semibold border transition-all disabled:opacity-60"
                        style={{
                          borderColor: area.activo ? 'var(--color-danger)' : 'var(--color-primary)',
                          color: area.activo ? 'var(--color-danger)' : 'var(--color-primary)',
                          backgroundColor: '#fff',
                        }}
                      >
                        {toggleLoadingId === area.id
                          ? 'Procesando...'
                          : area.activo
                            ? 'Desactivar'
                            : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
