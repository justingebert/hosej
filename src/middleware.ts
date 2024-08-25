import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/db/models/user';

export async function middleware(req: NextRequest) {
  try {
    const deviceId = req.cookies.get('deviceId') || req.headers.get('x-device-id');

    if (deviceId) {
      await dbConnect();
      const curUser = await User.findOne({ deviceId });

      if (curUser) {
        // If authenticated, continue to the requested page
        return NextResponse.next();
      }
    }

    // If not authenticated, redirect to sign-in page
    const loginUrl = new URL('/', req.url);
    return NextResponse.redirect(loginUrl);
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.redirect(new URL('/', req.url));
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'], // Paths to apply middleware
};
