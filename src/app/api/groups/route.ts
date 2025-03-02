import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Group from '@/db/models/Group';
import User from '@/db/models/user';

export const revalidate = 0

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id') as string;
  try{
    await dbConnect();
    const { name } = await req.json();
    
    const userAdmin = await User.findById(userId);
    if (!userAdmin) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    const member = {
      user: userAdmin._id,
      name: userAdmin.username,
    }
    const newGroup = new Group({
      name: name,
      admin: userAdmin._id,
      members: [member],
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

//get user by id
export async function GET(req: NextRequest){
    const userId = req.headers.get('x-user-id');
    try{
        await dbConnect();
        const user = await User.findById(userId).populate({path: 'groups', model: Group});
        return NextResponse.json({groups: user.groups}, {status: 200});
    }catch (error) {
        console.log(`Error getting groups for user: ${userId}`, error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}