import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Group from '@/db/models/Group';
import User from '@/db/models/user';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const { groupId, userId } = await req.json();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const isMember = group.members.some((member: any) => member.toString() === userId);
    if (isMember) {
      return NextResponse.json({ message: 'User is already a member of this group' }, { status: 400 });
    }

    group.members.push({user: user._id});
    await group.save();

    if (!user.groups.includes(groupId)) {
      user.groups.push(groupId); 
    }
    await user.save();

    return NextResponse.json({ message: `User ${user.username} successfully joined the group`, group }, { status: 200 });
  } catch (error) {
    console.error('Failed to join group:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
