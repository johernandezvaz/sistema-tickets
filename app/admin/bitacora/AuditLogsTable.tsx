'use client';

import { useState, useMemo } from 'react';
import type { AuditLogRow, UsuarioDetalle } from '@/lib/admin';

interface AuditLogsTableProps {
  logs: AuditLogRow[];
  usuarios: UsuarioDetalle[];
}

export default function AuditLogsTable({ logs, usuarios }: AuditLogsTableProps) {
  const [selectedUser, setSelectedUser] = useState('todos');
  const [selectedAction, setSelectedAction] = useState('todos');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const uniqueActions = useMemo(() => {
    const actions = new Set<string>();
    logs.forEach(log => {
      if (log.accion) actions.add(log.accion);
    });
    return Array.from(actions).sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchUser =
        selectedUser === 'todos' ||
        (log.usuario_id !== null && String(log.usuario_id) === selectedUser);

      const matchAction =
        selectedAction === 'todos' || log.accion === selectedAction;

      return matchUser && matchAction;
    });
  }, [logs, selectedUser, selectedAction]);

  function fmtDate(iso: string) {
    return new Intl.DateTimeFormat('es-MX', {
      dateStyle: 'short',
      timeStyle: 'medium',
      timeZone: 'America/Mexico_City',
    }).format(new Date(iso));
  }

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

      <div className="flex flex-wrap items-center gap-3 border-b pb-4 mb-2" style={{ borderColor: 'var(--color-border)' }}>
        <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Usuario:
          <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} style={selectStyle}>
            <option value="todos">Todos los usuarios</option>
            {usuarios.map(u => (
              <option key={u.id} value={u.id}>
                {u.nombre} {u.apellido} ({u.email})
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Acción:
          <select value={selectedAction} onChange={e => setSelectedAction(e.target.value)} style={selectStyle}>
            <option value="todos">Todas las acciones</option>
            {uniqueActions.map(action => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </label>

        <span className="ml-auto text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {filteredLogs.length} logs cargados
        </span>
      </div>

      {filteredLogs.length === 0 ? (
        <div className="text-center py-16 text-sm italic" style={{ color: 'var(--color-text-muted)' }}>
          No hay registros de auditoría que coincidan con los filtros.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--color-border)' }}>
          <table className="w-full text-left text-sm" style={{ backgroundColor: 'var(--color-surface)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'color-mix(in srgb, var(--color-navy) 4%, transparent)' }}>
                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-navy)', whiteSpace: 'nowrap' }}>Fecha</th>
                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-navy)', whiteSpace: 'nowrap' }}>Usuario</th>
                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-navy)', whiteSpace: 'nowrap' }}>Acción</th>
                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-navy)', whiteSpace: 'nowrap' }}>IP</th>
                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-navy)', whiteSpace: 'nowrap' }}>Detalles</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, i) => (
                <tr
                  key={log.id}
                  style={{
                    borderBottom: i < filteredLogs.length - 1 ? '1px solid var(--color-border)' : undefined,
                  }}
                  className="hover:bg-blue-50/20"
                >
                  <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>
                    {fmtDate(log.ocurrido_en)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {log.usuario_nombre ? (
                      <div>
                        <div className="font-semibold" style={{ color: 'var(--color-text-base)' }}>
                          {log.usuario_nombre}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          {log.usuario_email}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs italic" style={{ color: 'var(--color-text-muted)' }}>
                        Sistema / Público
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex rounded border px-2 py-0.5 text-xs font-mono font-semibold"
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--color-navy) 4%, transparent)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-navy)',
                      }}
                    >
                      {log.accion}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {log.ip || '—'}
                  </td>
                  <td className="px-4 py-3">
                    {log.detalle ? (
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                          className="w-fit text-xs font-semibold underline hover:opacity-75 transition-opacity"
                          style={{ color: 'var(--color-primary)' }}
                        >
                          {expandedId === log.id ? 'Contraer' : 'Expandir detalles'}
                        </button>
                        {expandedId === log.id && (
                          <pre
                            className="rounded border p-2 font-mono text-[10px] leading-relaxed max-w-xs sm:max-w-md overflow-x-auto whitespace-pre-wrap"
                            style={{
                              borderColor: 'var(--color-border)',
                              backgroundColor: 'color-mix(in srgb, var(--color-navy) 2%, transparent)',
                              color: 'var(--color-text-base)',
                            }}
                          >
                            {JSON.stringify(log.detalle, null, 2)}
                          </pre>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs italic" style={{ color: 'var(--color-text-muted)' }}>
                        Sin información adicional
                      </span>
                    )}
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
