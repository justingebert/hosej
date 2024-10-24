import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/db/models/user';

export async function POST(req: NextRequest) {
  await dbConnect();
  const { deviceId, userName } = await req.json();

  if (!deviceId || !userName) {
    return NextResponse.json({ message: 'Device ID and username are required' }, { status: 400 });
  }

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ deviceId });

    if (existingUser) {
      return NextResponse.json({ message: 'User with this device ID already exists' }, { status: 409 });
    }

    // Create a new user
    const newUser = new User({
      username: userName,
      deviceId,
    });
    await newUser.save();

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ message: 'Internal Server error' }, { status: 500 });
  }
}
