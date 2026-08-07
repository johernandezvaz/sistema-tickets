import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { RolUsuario } from '@/lib/types';


export const SESSION_COOKIE = 'session';
const SESSION_DURATION = '8h';

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('[auth] JWT_SECRET env variable is not set');
  return new TextEncoder().encode(secret);
}


export interface SessionPayload {
  sub: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: RolUsuario;
  area_id: number | null;
  must_change_password: boolean;
}


export async function signJwt(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(getSecret());
}

export async function verifyJwt(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}


export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await signJwt(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyJwt(token);
}
