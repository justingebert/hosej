import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/db/models/user';

export async function POST(req: NextRequest) {
  await dbConnect();

  const { deviceId, userName }:CreateUserRequest = await req.json();
  if (!deviceId || !userName) {
    return NextResponse.json({ message: 'Device ID and username are required' }, { status: 400 });
  }

  try {
    const existingUser = await User.findOne({ deviceId });
    if (existingUser) {
      return NextResponse.json({ message: 'User with this device ID already exists' }, { status: 409 });
    }

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

export async function PUT(req: NextRequest) {
  const userId = req.headers.get('x-user-id') as string;
  await dbConnect();
  console.log('userId', userId);
  try {
   const { ...data} = await req.json();

   const updatedUser = await User.findByIdAndUpdate(userId, data, { new: true });
   if (!updatedUser) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ message: 'Internal Server error' }, { status: 500 });
  }
}