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