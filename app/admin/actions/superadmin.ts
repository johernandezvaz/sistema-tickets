'use server';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { headers } from 'next/headers';
import {
  crearUsuarioAdmin,
  resetearContraseñaUsuario,
  crearArea,
  setAreaActiva,
} from '@/lib/admin';
import { revalidatePath } from 'next/cache';


async function requireSuperadmin() {
  const session = await getSession();
  if (!session) redirect('/admin/login');
  if (session.must_change_password) redirect('/admin/change-password');
  if (session.rol !== 'superadmin') {
    throw new Error('Acceso no autorizado: requiere privilegios de superadmin.');
  }
  return session;
}

async function getRequestMetadata() {
  const reqHeaders = await headers();
  const ip = reqHeaders.get('x-forwarded-for')?.split(',')[0] || reqHeaders.get('x-real-ip') || null;
  return { ip };
}


function generateTempPassword(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$';
  let pass = '';

  pass += '0123456789'[Math.floor(Math.random() * 10)];
  for (let i = 1; i < 12; i++) {
    pass += chars[Math.floor(Math.random() * chars.length)];
  }

  return pass.split('').sort(() => 0.5 - Math.random()).join('');
}


interface ActionState {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  passwordTemp?: string;
}

export async function crearUsuarioAction(formData: FormData): Promise<ActionState> {
  const session = await requireSuperadmin();

  const nombre = (formData.get('nombre') as string | null)?.trim() ?? '';
  const apellido = (formData.get('apellido') as string | null)?.trim() ?? '';
  const email = (formData.get('email') as string | null)?.trim().toLowerCase() ?? '';
  const areaIdRaw = formData.get('area_id') as string | null;

  const fieldErrors: Record<string, string> = {};

  if (!nombre) fieldErrors.nombre = 'El nombre es requerido.';
  if (!apellido) fieldErrors.apellido = 'El apellido es requerido.';

  if (!email) {
    fieldErrors.email = 'El correo es requerido.';
  } else if (!/^[^\s@]+@safe-demo\.com$/i.test(email)) {
    fieldErrors.email = 'El correo debe pertenecer al dominio @safe-demo.com.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  const areaId = areaIdRaw && areaIdRaw !== 'none' ? parseInt(areaIdRaw, 10) : null;
  const passwordTemp = generateTempPassword();

  const { ip } = await getRequestMetadata();

  try {
    await crearUsuarioAdmin(
      nombre,
      apellido,
      email,
      areaId,
      passwordTemp,
      parseInt(session.sub, 10),
      ip
    );

    revalidatePath('/admin/usuarios');
    return { ok: true, passwordTemp };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    return { ok: false, error: msg };
  }
}

export async function resetearPasswordAction(usuarioId: number): Promise<ActionState> {
  const session = await requireSuperadmin();
  const passwordTemp = generateTempPassword();
  const { ip } = await getRequestMetadata();

  try {
    await resetearContraseñaUsuario(
      usuarioId,
      passwordTemp,
      parseInt(session.sub, 10),
      ip
    );

    revalidatePath('/admin/usuarios');
    return { ok: true, passwordTemp };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    return { ok: false, error: msg };
  }
}

export async function crearAreaAction(formData: FormData): Promise<ActionState> {
  const session = await requireSuperadmin();
  const nombre = (formData.get('nombre') as string | null)?.trim() ?? '';

  if (!nombre) {
    return { ok: false, fieldErrors: { nombre: 'El nombre del área es requerido.' } };
  }

  const { ip } = await getRequestMetadata();

  try {
    await crearArea(nombre, parseInt(session.sub, 10), ip);
    revalidatePath('/admin/areas');
    revalidatePath('/api/areas');
    revalidatePath('/levantar');
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    return { ok: false, error: msg };
  }
}

export async function toggleAreaAction(areaId: number, activo: boolean): Promise<ActionState> {
  const session = await requireSuperadmin();
  const { ip } = await getRequestMetadata();

  try {
    await setAreaActiva(areaId, activo, parseInt(session.sub, 10), ip);
    revalidatePath('/admin/areas');
    revalidatePath('/api/areas');
    revalidatePath('/levantar');
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    return { ok: false, error: msg };
  }
}
