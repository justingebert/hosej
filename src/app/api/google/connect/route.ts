import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/db/models/user';

export async function POST(req: Request) {
  try {
    const body = await req.json(); 
    const { deviceId, googleUserId } = body;

    if (!deviceId) {
      return NextResponse.json({ success: false, message: 'No deviceId provided' }, { status: 400 });
    }

    await dbConnect();


    const googleUser = await User.findById(googleUserId);

    if (!googleUser) {
      return NextResponse.json({ success: false, message: 'Google user not found' }, { status: 404 });
    }


    const deviceUser = await User.findOne({ deviceId });

    if (!deviceUser) {
      return NextResponse.json({ success: false, message: 'User with deviceId not found' }, { status: 404 });
    }

    const googleId = googleUser.googleId;
    await User.deleteOne({ _id: googleUserId });

    deviceUser.googleId = googleId;
    deviceUser.deviceId = undefined;
    await deviceUser.save();
    
    return NextResponse.json({ success: true, message: 'Google account linked successfully.' }, { status: 200 });

  } catch (error) {
    console.error('Error merging accounts:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
