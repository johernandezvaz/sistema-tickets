'use server';

import { redirect } from 'next/navigation';
import { compare, hash } from 'bcryptjs';
import { createSession, destroySession, getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import type { Usuario } from '@/lib/types';


interface LoginResult {
  ok: false;
  error: string;
}

export async function loginAction(
  formData: FormData
): Promise<LoginResult | never> {
  const email = (formData.get('email') as string | null)?.trim().toLowerCase() ?? '';
  const password = (formData.get('password') as string | null) ?? '';

  const GENERIC = 'Credenciales incorrectas. Verifica tu correo y contraseña.';

  if (!email || !password) return { ok: false, error: GENERIC };

  const { rows } = await query<Usuario & { password_hash: string }>(
    `SELECT id, nombre, apellido, email, password_hash, rol, area_id,
            must_change_password, activo
     FROM usuarios
     WHERE email = $1
     LIMIT 1`,
    [email]
  );

  const user = rows[0];
  if (!user || !user.activo) return { ok: false, error: GENERIC };

  const valid = await compare(password, user.password_hash);
  if (!valid) return { ok: false, error: GENERIC };

  await createSession({
    sub: String(user.id),
    email: user.email,
    nombre: user.nombre,
    apellido: user.apellido,
    rol: user.rol,
    area_id: user.area_id,
    must_change_password: user.must_change_password,
  });

  if (user.must_change_password) {
    redirect('/admin/change-password');
  }
  redirect('/admin/tickets');
}


interface ChangePasswordResult {
  ok: false;
  errors: { nueva?: string; confirmar?: string; _global?: string };
}

export async function changePasswordAction(
  formData: FormData
): Promise<ChangePasswordResult | never> {
  const session = await getSession();
  if (!session) redirect('/admin/login');

  const nueva = (formData.get('nueva') as string | null) ?? '';
  const confirmar = (formData.get('confirmar') as string | null) ?? '';

  const errors: ChangePasswordResult['errors'] = {};

  if (nueva.length < 8)
    errors.nueva = 'La contraseña debe tener al menos 8 caracteres.';
  else if (!/[0-9]/.test(nueva))
    errors.nueva = 'Debe incluir al menos un número.';

  if (!confirmar)
    errors.confirmar = 'Confirma la contraseña.';
  else if (nueva !== confirmar)
    errors.confirmar = 'Las contraseñas no coinciden.';

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const passwordHash = await hash(nueva, 12);

  await query(
    `UPDATE usuarios SET password_hash = $1, must_change_password = false WHERE id = $2`,
    [passwordHash, parseInt(session.sub, 10)]
  );

  await createSession({ ...session, must_change_password: false });

  redirect('/admin/tickets');
}

export async function logoutAction(): Promise<never> {
  await destroySession();
  redirect('/');
}
