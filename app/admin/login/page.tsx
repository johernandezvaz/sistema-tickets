import LoginForm from './LoginForm';

export const metadata = { title: 'Acceso administrativo' };

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">

        <div className="mb-8 flex flex-col items-center text-center">
          <img src="/safe-demo_logo-blc-Photoroom.png" alt="Safe Demo logo"
               className="mb-5 h-12 w-auto object-contain" />
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-navy)' }}>
            Panel Administrativo
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Acceso restringido al personal autorizado.
          </p>
        </div>

        <div className="card">
          <LoginForm />
        </div>

      </div>
    </div>
  );
}
