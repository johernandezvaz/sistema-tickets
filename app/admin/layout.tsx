import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { logoutAction } from '@/app/admin/actions/auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();


  if (!session || session.must_change_password) {
    return <>{children}</>;
  }

  const rolLabel = session.rol === 'superadmin' ? 'Super Admin' : 'Administrador';

  return (
    <div className="min-h-screen flex flex-col">
      <header
        className="sticky top-0 z-40 flex h-14 items-center justify-between px-6 shadow-sm"
        style={{ backgroundColor: 'var(--color-navy)', color: '#fff' }}
      >
        <div className="flex items-center gap-3">
          <img
            src="/safe-demo_logo-blc-Photoroom.png"
            alt="Safe Demo logo"
            className="h-7 w-auto object-contain"
          />
          <span className="hidden text-sm font-medium opacity-70 sm:block">
            Sistema de Tickets
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold leading-none">
              {session.nombre} {session.apellido}
            </p>
            <p className="mt-0.5 text-xs opacity-60">{rolLabel}</p>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg border border-white/20
                         px-3 py-1.5 text-xs font-medium text-white/80
                         transition-colors hover:bg-white/10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
                <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M6 10a.75.75 0 0 1 .75-.75h9.546l-1.048-.943a.75.75 0 1 1 1.004-1.114l2.5 2.25a.75.75 0 0 1 0 1.114l-2.5 2.25a.75.75 0 1 1-1.004-1.114l1.048-.943H6.75A.75.75 0 0 1 6 10z" clipRule="evenodd" />
              </svg>
              Salir
            </button>
          </form>
        </div>
      </header>

      {session.rol === 'superadmin' && (
        <nav
          className="border-b flex justify-start items-center"
          style={{ backgroundColor: '#fff', borderColor: 'var(--color-border)' }}
        >
          <div className="mx-auto w-full max-w-6xl px-6 flex gap-4">
            <Link
              href="/admin/tickets"
              className="py-3.5 text-xs font-semibold uppercase tracking-wider hover:opacity-75 transition-opacity"
              style={{ color: 'var(--color-navy)' }}
            >
              Tickets
            </Link>
            <Link
              href="/admin/usuarios"
              className="py-3.5 text-xs font-semibold uppercase tracking-wider hover:opacity-75 transition-opacity"
              style={{ color: 'var(--color-navy)' }}
            >
              Usuarios
            </Link>
            <Link
              href="/admin/areas"
              className="py-3.5 text-xs font-semibold uppercase tracking-wider hover:opacity-75 transition-opacity"
              style={{ color: 'var(--color-navy)' }}
            >
              Áreas
            </Link>
            <Link
              href="/admin/bitacora"
              className="py-3.5 text-xs font-semibold uppercase tracking-wider hover:opacity-75 transition-opacity"
              style={{ color: 'var(--color-navy)' }}
            >
              Bitácora
            </Link>
          </div>
        </nav>
      )}

      <main className="flex-1 px-6 pt-10 pb-8">
        <div className="mx-auto max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}
