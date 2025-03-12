import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { isUserInGroup } from "@/lib/groupAuth";
import Group from "@/db/models/Group";
import User from "@/db/models/user";

export const revalidate = 0;

//get group
export async function GET(req: NextRequest, { params }: { params: { groupId: string } }) {
    const userId = req.headers.get("x-user-id") as string;
    try {
        const { groupId } = params;
        await dbConnect();

        const authCheck = await isUserInGroup(userId, groupId);
        if (!authCheck.isAuthorized) {
            return NextResponse.json({ message: authCheck.message }, { status: authCheck.status });
        }

        let group = await Group.findById(groupId);
        const userIsAdmin = group.admin.equals(userId);
        group = group.toObject();
        group.userIsAdmin = userIsAdmin;

        return NextResponse.json(group, { status: 200 });
    } catch (error) {
        console.error("Error fetching group", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

//update group
export async function PUT(req: NextRequest, { params }: { params: { groupId: string } }) {
    const userId = req.headers.get("x-user-id") as string;
    try {
        const { groupId } = params;

        const data = await req.json();
        await dbConnect();

        const authCheck = await isUserInGroup(userId, groupId);
        if (!authCheck.isAuthorized) {
            return NextResponse.json({ message: authCheck.message }, { status: authCheck.status });
        }
        const user = await User.findById(userId);
        const group = await Group.findById(groupId);
        if (!group.admin.equals(user._id)) {
            return NextResponse.json(
                { message: "You are not the admin of this group" },
                { status: 403 }
            );
        }
        group.set(data);
        await group.save();

        return NextResponse.json(group, { status: 200 });
    } catch (error) {
        console.error("Error updating group", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

//delete group
export async function DELETE(req: NextRequest, { params }: { params: { groupId: string } }) {
    const userId = req.headers.get("x-user-id") as string;
    try {
        const { groupId } = params;

        await dbConnect();

        const authCheck = await isUserInGroup(userId, groupId);
        if (!authCheck.isAuthorized) {
            return NextResponse.json({ message: authCheck.message }, { status: authCheck.status });
        }
        const user = await User.findById(userId);
        const group = await Group.findById(groupId);
        if (!group.admin.equals(user._id)) {
            return NextResponse.json(
                { message: "You are not the admin of this group" },
                { status: 403 }
            );
        }

        for (const member of group.members) {
            const user = await User.findById(member.user);
            user.groups = user.groups.filter((group: string) => group !== groupId);
            await user.save();
        }

        await Group.findByIdAndDelete(groupId);

        return NextResponse.json({ message: "Group deleted" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting group", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
