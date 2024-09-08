import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/db/models/user'; 

export async function POST(req: any, { params }: { params: { id: string } }) {
  try {
    const { token } = await req.json();
    const { id: userId } = params;

    await dbConnect();

    // Find the user by userId and remove their FCM token
    await User.updateOne({ _id: userId }, { $unset: { fcmToken: token } });

    return NextResponse.json({ success: true, message: 'FCM token unregistered successfully.' }, { status: 200 });
  } catch (error) {
    console.error('Error during FCM token unregistration:', error);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
