import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Group from '@/db/models/Group';

export async function POST(req: NextRequest) {
  await dbConnect();

  const { name, user } = await req.json();

  const newGroup = new Group({
    name,
    admin: user._id,
    members: [user._id],
  });

  await newGroup.save();
  return NextResponse.json(newGroup, { status: 201 });
}
