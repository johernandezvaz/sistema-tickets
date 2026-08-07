'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { AdminTicketRow } from '@/lib/tickets';

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; bg: string; text: string }> = {
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
  const { label, bg, text } = cfg[status] ?? { label: status, bg: 'var(--color-bg)', text: 'var(--color-text-base)' };
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap"
      style={{ backgroundColor: bg, color: text }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: text }} />
      {label}
    </span>
  );
}

function PrioridadBadge({ prioridad }: { prioridad: string }) {
  const cfg: Record<string, { label: string; color: string }> = {
    baja: { label: 'Baja', color: 'var(--color-text-muted)' },
    media: { label: 'Media', color: 'var(--color-warning)' },
    alta: { label: 'Alta', color: 'var(--color-danger)' },
  };
  const { label, color } = cfg[prioridad] ?? cfg.baja;
  return (
    <span className="text-xs font-semibold" style={{ color }}>
      {label}
    </span>
  );
}


function fmtDate(iso: string) {
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Mexico_City',
  }).format(new Date(iso));
}


interface TicketsTableProps {
  tickets: AdminTicketRow[];
}

export default function TicketsTable({ tickets }: TicketsTableProps) {
  const [statusFilter, setStatusFilter] = useState('todos');
  const [prioridadFilter, setPrioridadFilter] = useState('todos');

  const filtered = useMemo(() =>
    tickets.filter(t => {
      const matchStatus = statusFilter === 'todos' || t.status === statusFilter;
      const matchPrioridad = prioridadFilter === 'todos' || t.prioridad === prioridadFilter;
      return matchStatus && matchPrioridad;
    }),
    [tickets, statusFilter, prioridadFilter]
  );

  const selectStyle: React.CSSProperties = {
    borderRadius: '0.5rem',
    border: '1px solid var(--color-border)',
    backgroundColor: '#fff',
    padding: '0.375rem 2rem 0.375rem 0.75rem',
    fontSize: '0.875rem',
    color: 'var(--color-text-base)',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b7280'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06z' clip-rule='evenodd'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 0.5rem center',
    backgroundSize: '1rem',
    outline: 'none',
    cursor: 'pointer',
  };

  return (
    <div className="flex flex-col gap-4">

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Status:
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectStyle}>
            <option value="todos">Todos</option>
            <option value="levantado">Levantado</option>
            <option value="en_proceso">En proceso</option>
            <option value="finalizado">Finalizado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Prioridad:
          <select value={prioridadFilter} onChange={e => setPrioridadFilter(e.target.value)} style={selectStyle}>
            <option value="todos">Todas</option>
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
          </select>
        </label>

        <span className="ml-auto text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {filtered.length} de {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div
          className="rounded-xl border py-16 text-center text-sm"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
        >
          No hay tickets con los filtros seleccionados.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
          <table className="w-full text-left text-sm" style={{ backgroundColor: 'var(--color-surface)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'color-mix(in srgb, var(--color-navy) 4%, transparent)' }}>
                {['Folio', 'Solicitante', 'Área', 'Prioridad', 'Status', 'Responsable', 'Fecha', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--color-navy)', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => (
                <tr
                  key={t.id}
                  style={{
                    borderBottom: i < filtered.length - 1 ? '1px solid var(--color-border)' : undefined,
                  }}
                  className="transition-colors hover:bg-blue-50/30"
                >
                  <td className="px-4 py-3 font-mono text-xs font-semibold"
                    style={{ color: 'var(--color-primary)' }}>
                    {t.folio}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--color-text-base)' }}>
                    {t.nombre} {t.apellido}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {t.area_nombre ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <PrioridadBadge prioridad={t.prioridad} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {t.responsable_nombre ?? <span className="italic">Sin asignar</span>}
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>
                    {fmtDate(t.creado_en)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/tickets/${t.id}`}
                      className="rounded-md px-3 py-1.5 text-xs font-medium text-white
                                 transition-opacity hover:opacity-85 whitespace-nowrap"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
