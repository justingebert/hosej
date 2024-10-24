import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/db/models/user'; 

export async function POST(req: any, { params }: { params: { id: string } }) {
  try {
    const { token } = await req.json();
    const { id: userId } = params;

    await dbConnect();

    await User.updateOne({ _id: userId }, { $unset: { fcmToken: token } });

    return NextResponse.json({message: 'FCM token unregistered successfully.' }, { status: 200 });
  } catch (error) {
    console.error('Error during FCM token unregistration:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
