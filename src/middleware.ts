import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Define public routes
  const publicRoutes = [
    "/api/*",
    '/api/users/create', 
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
    '/',
  ];

  // Log the request URL and token status
  //console.log(`Requesting: ${pathname}`);
  
  if (publicRoutes.includes(pathname)) {
    //console.log('Public route, allowing access.');
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  //console.log(`Token retrieved: ${token ? 'Valid' : 'Invalid or Missing'}`);

  if (token) {
    //console.log('Token is valid, allowing access.');
    return NextResponse.next();
  }

  if (req.nextUrl.pathname.startsWith('/api/auth/callback/credentials')) {
    return NextResponse.next();
  }

  //console.log('No valid token, redirecting to login.');
  const loginUrl = new URL('/', req.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};
