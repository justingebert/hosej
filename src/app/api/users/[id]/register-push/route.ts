import { NextResponse } from 'next/server';
import dbConnect from "@/lib/dbConnect";
import User from '@/db/models/user';

export async function POST(req: any, { params }: { params: { id: string } }) {
  await dbConnect();

  const { id: userId } = params;
  const data = await req.json();
  const token = data.token;

  if (!token) {
    return NextResponse.json({ message: "Token is required" }, { status: 400 });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (user.fcmToken === token) {
      return NextResponse.json({ message: 'Token already exists' }, { status: 200 });
    }

    user.fcmToken = token
    await user.save();

    return NextResponse.json({ message: "Token registered successfully" }, { status: 201 });
  } catch (error) {
    console.error("Error saving FCM token:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
