import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Group from '@/db/models/Group';
import User from '@/db/models/user';


export async function POST (req: NextRequest) {
  try {
    await dbConnect();
    const { user } = await req.json();
    if(!user) {
      return NextResponse.json({ message: "User not found" }, { status: 400 });
    }

    const groups = await Group.find({ members: user._id});
    return NextResponse.json(groups, { status: 200 });
  }catch (error) {
    console.error("Failed to fetch groups:", error);
    return NextResponse.json({ message: "Failed to fetch groups" }, { status: 500 });
  }
}