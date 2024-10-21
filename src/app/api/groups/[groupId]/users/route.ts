import { NextRequest, NextResponse } from 'next/server'
import dbConnect from "@/lib/dbConnect";
import User from "@/db/models/user";

export const revalidate = 0

//get all users from group
export async function GET(req: NextRequest, { params }: { params: { groupId: string } }) {
  try {
    const { groupId } = params;
    await dbConnect();

    const users = await User.find({"groups.group": groupId});

    return NextResponse.json(users);
  }
  catch (error) {
    console.error("Error fetching users", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
