import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const publicRoutes = ['/api/users/migrate', '/api/users/create'];

  if (publicRoutes.includes(req.nextUrl.pathname)) {
    return NextResponse.next();
  }
  // Step 1: Check if the user is authenticated via NextAuth (Google, etc.)
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (token) {
    // User is authenticated via NextAuth, allow through
    return NextResponse.next();
  }

  // Step 3: If neither authentication method is valid, redirect to the sign-in page
  const loginUrl = new URL('/', req.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'], // Paths to apply middleware
};
