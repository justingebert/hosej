import {NextRequest, NextResponse} from "next/server";
import dbConnect from "@/lib/dbConnect";
import {isUserInGroup} from "@/lib/groupAuth";
import Group from "@/db/models/Group";
import User from "@/db/models/user";
import {AuthedContext, withAuthAndErrors} from "@/lib/api/withAuth";
import {ForbiddenError, NotFoundError} from "@/lib/api/errorHandling";

export const revalidate = 0;

//get group
export const GET = withAuthAndErrors(
    async (
        req: NextRequest,
        {params, userId}: AuthedContext<{ params: { groupId: string } }>
    ) => {
        const {groupId} = params;
        await dbConnect();

        await isUserInGroup(userId, groupId);

        const groupDoc = await Group.findById(groupId);
        if (!groupDoc) throw new NotFoundError("Group not found");

        const userIsAdmin = groupDoc.admin.equals(userId);
        const group = groupDoc.toObject();
        (group as any).userIsAdmin = userIsAdmin;

        return NextResponse.json(group, {status: 200});
    }
);

//update group
export const PUT = withAuthAndErrors(
    async (
        req: NextRequest,
        {params, userId}: AuthedContext<{ params: { groupId: string } }>
    ) => {
        const {groupId} = params;

        const data = await req.json();
        await dbConnect();

        await isUserInGroup(userId, groupId);


        const user = await User.findById(userId);
        const group = await Group.findById(groupId);
        if (!user || !group) throw new NotFoundError("User or group not found");

        if (!group.admin.equals(user._id)) {
            throw new ForbiddenError("You are not the admin of this group");
        }

        group.set(data);
        await group.save();

        return NextResponse.json(group, {status: 200});
    }
);


export const DELETE = withAuthAndErrors(
    async (
        req: NextRequest,
        {params, userId}: AuthedContext<{ params: { groupId: string } }>
    ) => {
        const {groupId} = params;

        await dbConnect();

        await isUserInGroup(userId, groupId);

        const user = await User.findById(userId).orFail();
        const group = await Group.findById(groupId);

        if (!group.admin.equals(user._id)) {
            throw new ForbiddenError("You are not the admin of this group");
        }

        for (const member of group.members) {
            const memberUser = await User.findById(member.user);
            if (memberUser) {
                memberUser.groups = memberUser.groups.filter(
                    (g) => g !== groupId
                );
                await memberUser.save();
            }
        }

        await Group.findByIdAndDelete(groupId);

        return NextResponse.json({message: "Group deleted"}, {status: 200});
    }
);
