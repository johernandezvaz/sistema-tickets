import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getAuditLogs, getUsuariosList } from '@/lib/admin';
import AuditLogsTable from './AuditLogsTable';

export const metadata = {
  title: 'Bitácora de Auditoría | Panel Admin',
};

export const dynamic = 'force-dynamic';

export default async function AuditLogPage() {
  const session = await getSession();

  if (!session) {
    redirect('/admin/login');
  }

  if (session.rol !== 'superadmin') {
    redirect('/admin/tickets');
  }

  const logs = await getAuditLogs();
  const usuarios = await getUsuariosList();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-navy)' }}>
          Bitácora de Auditoría
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Historial completo de las acciones administrativas realizadas en la plataforma.
        </p>
      </div>

      <div className="card">
        <AuditLogsTable logs={logs} usuarios={usuarios} />
      </div>
    </div>
  );
}
