import { NextRequest, NextResponse } from 'next/server'
import dbConnect from "@/lib/dbConnect";
import User from "@/db/models/user";

export const revalidate = 0

//get all users from group
export async function GET(req: NextRequest, { params }: { params: { groupId: string } }) {
  await dbConnect();

  const { groupId } = params;

  const users = await User.find({groups: groupId});

  return NextResponse.json(users);
}
