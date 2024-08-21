import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import user from '@/db/models/user';
import Group from '@/db/models/Group';

export async function GET(req: Request, { params }: { params: { groupId: string } }) {
  try {
    await dbConnect();
    
    const { groupId } = params;
    const group = await Group.findById(groupId)
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }
    const count = group.members.length;
    
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Failed to fetch user count:', error);
    return NextResponse.json({ error: 'Failed to fetch user count' }, { status: 500 });
  }
}
