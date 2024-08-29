// app/api/users/device/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/db/models/user';

export async function POST(request: Request) {
  await dbConnect();
  const { deviceId } = await request.json();

  if (!deviceId) {
    return NextResponse.json({ message: 'Device ID is required' }, { status: 400 });
  }

  try {
    const curUser = await User.findOne({ deviceId });

    if (!curUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({user:curUser}, { status: 200 });
  } catch (error) {
    console.error('Error fetching user by device ID:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
