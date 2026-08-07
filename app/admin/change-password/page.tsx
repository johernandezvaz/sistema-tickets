import ChangePasswordForm from './ChangePasswordForm';

export const metadata = { title: 'Establecer contraseña' };

export default function ChangePasswordPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <img src="/safe-demo_logo-blc-Photoroom.png" alt="Safe Demo logo"
               className="mb-5 h-12 w-auto object-contain" />
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-navy)' }}>
            Establecer contraseña
          </h1>
        </div>
        <div className="card">
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
