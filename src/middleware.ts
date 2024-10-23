import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Group from './db/models/Group';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
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
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    const loginUrl = new URL('/', req.url);
    return NextResponse.redirect(loginUrl);
  }

  // For routes under /api/groups/[groupId]/**, check groupId validity
  const groupIdMatch = pathname.match(/\/api\/groups\/([^/]+)\/?/);
  if (groupIdMatch) {
    const groupId = groupIdMatch[1];

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return NextResponse.json({ message: 'Invalid groupId format' }, { status: 400 });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json({ message: 'Group not found' }, { status: 404 });
    }

    const userId = token?.userId; 
    const isMember = group.members.some((member:any) => member.user.toString() === userId);
    if (!isMember) {
      return NextResponse.json({ message: 'You are not a member of this group' }, { status: 403 });
    }
  }

  // Allow the request to proceed if all checks pass
  return NextResponse.next();
}

// Middleware configuration to match relevant routes
export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};
