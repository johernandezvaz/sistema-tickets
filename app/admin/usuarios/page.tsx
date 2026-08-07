import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getUsuariosList } from '@/lib/admin';
import { getAreas } from '@/lib/tickets';
import UsuariosDashboard from './UsuariosDashboard';

export const metadata = {
  title: 'Gestión de Usuarios | Panel Admin',
};

export const dynamic = 'force-dynamic';

export default async function UsuariosPage() {
  const session = await getSession();

  if (!session) {
    redirect('/admin/login');
  }

  if (session.rol !== 'superadmin') {
    redirect('/admin/tickets');
  }

  const usuarios = await getUsuariosList();
  const areas = await getAreas();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-navy)' }}>
          Gestión de Usuarios
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Registra nuevos usuarios administradores de área o restablece contraseñas de cuentas existentes.
        </p>
      </div>

      <UsuariosDashboard initialUsuarios={usuarios} areas={areas} />
    </div>
  );
}
