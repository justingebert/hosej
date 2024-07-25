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
      const newToken = await FcmToken.create({ token });
      return NextResponse.json(newToken);
    } catch (error) {
      return NextResponse.json({ message: "Error saving FcmToken", error });
    }
  }
  