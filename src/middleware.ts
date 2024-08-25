import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import user from '@/db/models/user';

export async function middleware(req: NextRequest) {
  const deviceId = req.cookies.get('deviceId') || req.headers.get('x-device-id');

  if (deviceId) {
    await dbConnect();
    const user = await user.findOne({ deviceId });

    if (user) {
      // If authenticated, continue to the requested page
      req.nextUrl.pathname = `/auth/callback`; // Adjust as necessary
      return NextResponse.next();
    }
  }

  // If not authenticated, redirect to sign-in page
  const loginUrl = new URL('/auth/signin', req.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'], // Paths to apply middleware
};
