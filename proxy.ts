import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import type { SessionPayload } from '@/lib/auth';

const SESSION_COOKIE = 'session';

function getSecret() {
  return new TextEncoder().encode(process.env.JWT_SECRET ?? '');
}

const PUBLIC_ADMIN_ROUTES = ['/admin/login'];

const ALLOWED_WHILE_MUST_CHANGE = ['/admin/login', '/admin/change-password'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (!token) {
    if (PUBLIC_ADMIN_ROUTES.includes(pathname)) return NextResponse.next();
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  let payload: SessionPayload;
  try {
    const { payload: raw } = await jwtVerify(token, getSecret());
    payload = raw as unknown as SessionPayload;
  } catch {

    const response = NextResponse.redirect(new URL('/admin/login', request.url));
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  if (pathname === '/admin/login') {
    return NextResponse.redirect(new URL('/admin/tickets', request.url));
  }

  if (payload.must_change_password && !ALLOWED_WHILE_MUST_CHANGE.includes(pathname)) {
    return NextResponse.redirect(new URL('/admin/change-password', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
