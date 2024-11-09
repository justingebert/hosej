import Group, { IGroup } from "@/db/models/Group";
import User from "@/db/models/user";
import dbConnect from "@/lib/dbConnect";
import { isUserInGroup } from "@/lib/groupAuth";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest, { params }: { params: { groupId: string, memberId: string } }) {
  const userId = req.headers.get('x-user-id') as string;
  try {
    const { groupId, memberId } = params;

    await dbConnect();

    const authCheck = await isUserInGroup(userId, groupId);
    if (!authCheck.isAuthorized) {
      return NextResponse.json({ message: authCheck.message }, { status: authCheck.status });
    }
    const member = await User.findById(memberId);
    const user = await User.findById(userId);
    const group = await Group.findById(groupId);
    if(!group.admin.equals(user._id) || userId !== memberId){
      return NextResponse.json({ message: "You are not the admin of this group" }, { status: 403 });
    }

    group.members = group.members.filter((member:IGroup["members"][number]) => member.user.toString() !== memberId);
    await group.save();

    member.groups = member.groups.filter((group: string) => group !== groupId);
    await member.save();

    if(group.members.length === 0) {
      await Group.findByIdAndDelete(groupId);
      return NextResponse.json({ message: "Group deleted" }, { status: 200 });
    }

    return NextResponse.json(group, { status: 200 });
  }
  catch (error) {
    console.error("Error kicking member", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}