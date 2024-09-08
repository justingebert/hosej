import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/db/models/user';

export async function POST(req: Request) {
  try {
    const body = await req.json(); 
    const { deviceId, userId } = body;

    if (!deviceId) {
      return NextResponse.json({ success: false, message: 'No deviceId provided' }, { status: 400 });
    }

    await dbConnect();

    const googleUser = await User.findById(userId);

    if (!googleUser) {
      return NextResponse.json({ success: false, message: 'Google user not found' }, { status: 404 });
    }

    googleUser.deviceId = deviceId;
    googleUser.googleId = null;
    await googleUser.save();
    
    return NextResponse.json({ success: true, message: 'Google account successfully unlinked.' }, { status: 200 });

  } catch (error) {
    console.error('Error merging accounts:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
