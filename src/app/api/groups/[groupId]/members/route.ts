import { NextRequest, NextResponse } from 'next/server'
import dbConnect from "@/lib/dbConnect";
import User from '@/db/models/user';
import Group from '@/db/models/Group';
import { isUserInGroup } from '@/lib/groupAuth';

export const revalidate = 0
//get user by id
export async function GET(req: NextRequest,  { params }: { params: { groupId: string } }){
    const userId = req.headers.get('x-user-id') as string;
    
    const { groupId } = params;
    try{
        const authCheck = await isUserInGroup(userId, groupId);
        if (!authCheck.isAuthorized) {
        return NextResponse.json({ message: authCheck.message }, { status: authCheck.status });
        }
        await dbConnect();
        const group = await Group.findById(groupId).populate({path: 'members', model: User});

        return NextResponse.json(group.members, {status: 200});
    }catch (error) {
        console.log(`Error getting members for group: ${groupId}`, error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}


export async function POST(req: NextRequest,  { params }: { params: { groupId: string } }) {
    const userId = req.headers.get('x-user-id') as string;
    const { groupId } = params;
    try {
      await dbConnect();
  
  
      const user = await User.findById(userId);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
  
      const group = await Group.findById(groupId);
      if (!group) {
        return NextResponse.json({ error: 'Group not found' }, { status: 404 });
      }
  
      const isMember = group.members.some((member: any) => member.user.toString() === userId);
      if (isMember) {
        return NextResponse.json({ message: 'User is already a member of this group' }, { status: 400 });
      }
  
      group.members.push({user: user._id, name: user.username});
      await group.save();
  
      if (!user.groups.includes(groupId)) {
        user.groups.push(groupId); 
        await user.save();
      }
  
      return NextResponse.json({ message: `User ${user.username} successfully joined the group`, group }, { status: 200 });
    } catch (error) {
      console.error('Failed to join group:', error);
      return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
  }