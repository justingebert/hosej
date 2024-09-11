import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Group from '@/db/models/Group';
import User from '@/db/models/user';

export async function POST(req: NextRequest) {
  try{
    await dbConnect();
    const { name, user } = await req.json();
    console.log(name)
    console.log(user)
  
    const newGroup = new Group({
      name: name,
      admin: user._id,
      members: [user._id],
    });
  
    await newGroup.save();

    const userAdmin = await User.findById(user._id);
    userAdmin.groups.push(newGroup._id);
    await userAdmin.save();

    return NextResponse.json(newGroup, { status: 201 });
  }catch (error) {
    console.error("Failed to fetch groups:", error);
    return NextResponse.error();
  }
}
