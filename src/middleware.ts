import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  const publicRoutes = [
    '/api/auth/session', 
    '/api/auth/providers', 
    '/api/auth/csrf', 
    '/api/auth/signin',
    "/api/auth/signin/google",
    '/api/auth/callback',
    '/api/auth/callback/credentials',
    "/deviceauth",
    "/mainifest.json",
    "/api/cron",
    "/api/auth/callback/google",
    "/terms",
    "/privacy",
    '/',
  ];
  if (publicRoutes.includes(pathname) || (pathname === '/api/users' && req.method === 'POST')) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    const loginUrl = new URL('/', req.url);
    return NextResponse.redirect(loginUrl);
  }

  const userId = token.userId as string;
  const response = NextResponse.next();
  response.headers.set('x-user-id', userId);

  return response;
}

// Middleware configuration to match relevant routes
export const config = {
  matcher: [
  '/((?!_next/static|_next/image|favicon.ico|assets|public|manifest.json).*)'
  ]
};