import { NextRequest, NextResponse } from 'next/server'
import dbConnect from "@/lib/dbConnect";
import { isUserInGroup } from '@/lib/groupAuth';
import Group from '@/db/models/Group';

export const revalidate = 0

//get group
export async function GET(req: NextRequest, { params }: { params: { groupId: string } }) {
  const userId = req.headers.get('x-user-id') as string;
  try {
    const { groupId } = params;
    await dbConnect();

    const authCheck = await isUserInGroup(userId, groupId);
    if (!authCheck.isAuthorized) {
      return NextResponse.json({ message: authCheck.message }, { status: authCheck.status });
    }

    const group = await Group.findById(groupId)

    return NextResponse.json(group, { status: 200 });
  }
  catch (error) {
    console.error("Error fetching group", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
