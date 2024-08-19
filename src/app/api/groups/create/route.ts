import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Group from '@/db/models/Group';

export async function POST(req: NextRequest) {
  try{
    await dbConnect();
    const { name, user } = await req.json();
    console.log(user)
  
    const newGroup = new Group({
      name: name,
      admin: user._id,
      members: [user._id],
    });
  
    await newGroup.save();
    return NextResponse.json(newGroup, { status: 201 });
  }catch (error) {
    console.error("Failed to fetch groups:", error);
    return NextResponse.error();
  }
}
