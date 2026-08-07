import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getAdminTickets } from '@/lib/tickets';
import TicketsTable from './TicketsTable';

export const metadata = {
  title: 'Gestión de Tickets | Panel Admin',
};

export const dynamic = 'force-dynamic';

export default async function AdminTicketsPage() {
  const session = await getSession();

  if (!session) {
    redirect('/admin/login');
  }

  const tickets = await getAdminTickets(session.rol, session.area_id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-navy)' }}>
          Bandeja de Tickets
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {session.rol === 'superadmin'
            ? 'Visualizando todos los tickets registrados en el sistema.'
            : 'Visualizando los tickets correspondientes a tu área asignada.'}
        </p>
      </div>

      <div className="card">
        <TicketsTable tickets={tickets} />
      </div>
    </div>
  );
}
