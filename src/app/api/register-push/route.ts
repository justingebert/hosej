import { NextResponse } from 'next/server'
import dbConnect from "@/lib/dbConnect";
import FcmToken from '@/db/models/FcmToken';

export async function POST(req: any, res: NextResponse) {
    await dbConnect();
  
    const data = await req.json();
    const token = data.token;
    console.log('token:', token);
    if (!token) {
      return NextResponse.json({ message: "token is required" });
    }
    try {
      const existingToken = await FcmToken.findOne({ token: token });
      if (existingToken) {
        return NextResponse.json({ message: 'Token already exists' }, { status: 200 });
      }

      // If the token does not exist, add it to the database
      const newToken = await FcmToken.create({ token });
    return NextResponse.json(newToken, { status: 201 });
    } catch (error) {
      return NextResponse.json({ message: "Error saving FcmToken", error });
    }
  }
  