import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import Group from '@/db/models/Group';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const { groupId, userId } = await req.json();

    // Validate the groupId
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return NextResponse.json({ error: 'Invalid Group ID' }, { status: 400 });
    }

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid User ID' }, { status: 400 });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check if the user is already a member
    if (group.members.includes(userId)) {
      return NextResponse.json({ message: 'User is already a member' }, { status: 200 });
    }

    // Add the user to the group's members array
    group.members.push(userId);
    await group.save();

    return NextResponse.json(group, { status: 200 });
  } catch (error) {
    console.error('Failed to join group:', error);
    return NextResponse.json({ error: 'Failed to join group' }, { status: 500 });
  }
}
