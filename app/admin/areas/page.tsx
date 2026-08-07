import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getAllAreas } from '@/lib/admin';
import AreasDashboard from './AreasDashboard';

export const metadata = {
  title: 'Gestión de Áreas | Panel Admin',
};

export const dynamic = 'force-dynamic';

export default async function AreasPage() {
  const session = await getSession();

  if (!session) {
    redirect('/admin/login');
  }

  if (session.rol !== 'superadmin') {
    redirect('/admin/tickets');
  }

  const areas = await getAllAreas();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-navy)' }}>
          Gestión de Áreas
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Crea nuevas áreas o gestiona el estado de activación de las existentes.
        </p>
      </div>

      <AreasDashboard initialAreas={areas} />
    </div>
  );
}
