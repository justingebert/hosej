import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Group from '@/db/models/Group';
import User from '@/db/models/user';

export async function POST(req: NextRequest) {
  try{
    await dbConnect();
    const { name, user } = await req.json();
    
    const userAdmin = await User.findById(user._id);
    if (!userAdmin) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const newGroup = new Group({
      name: name,
      admin: userAdmin._id,
      members: [userAdmin._id],
    });
    await newGroup.save();
    
    userAdmin.groups.push(newGroup._id);
    await userAdmin.save();

    return NextResponse.json(newGroup, { status: 201 });
  }catch (error) {
    console.error("Failed to create group", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
