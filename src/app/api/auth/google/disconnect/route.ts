import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/db/models/user';

//TODO only user should be able to unlink their own account
export async function POST(req: Request) {
  try {
    const body = await req.json(); 
    const { deviceId, userId } = body;
    if (!deviceId) {
      return NextResponse.json({message: 'No deviceId provided' }, { status: 400 });
    }

    await dbConnect();

    const googleUser = await User.findById(userId);
    if (!googleUser) {
      return NextResponse.json({ message: 'Google user not found' }, { status: 404 });
    }

    googleUser.deviceId = deviceId;
    googleUser.googleId = undefined;
    googleUser.googleConnected = false;
    await googleUser.save();
    
    return NextResponse.json({ message: 'Google account successfully unlinked.' }, { status: 200 });

  } catch (error) {
    console.error('Error merging accounts:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
