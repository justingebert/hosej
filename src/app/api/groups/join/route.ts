// app/api/groups/join/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Group from '@/db/models/Group';


export async function POST(req: NextRequest) {

  await dbConnect();

  const { groupId, user } = await req.json();

  const group = await Group.findById(groupId);

  if (!group) {
    return NextResponse.json({ message: 'Group not found' }, { status: 404 });
  }

  if (!group.members.includes(user._id)) {
    group.members.push(user._id);
    await group.save();
  }

  return NextResponse.json(group, { status: 200 });
}
