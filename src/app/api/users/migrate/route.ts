// app/api/users/migrate/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/db/models/user';

export async function POST(request: Request) {
  await dbConnect();
  const { username, deviceId } = await request.json();

  if (!username || !deviceId) {
    return NextResponse.json({ message: 'Username and device ID are required' }, { status: 400 });
  }

  try {
    const curUser = await User.findOne({ username });

    if (!curUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    curUser.deviceId = deviceId; 
    await curUser.save();

    return NextResponse.json({user:curUser}, { status: 200 });
  } catch (error) {
    console.error('Error during user migration:', error);
    return NextResponse.json({ message: 'Server error during migration' }, { status: 500 });
  }
}
