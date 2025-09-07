import Group from "@/db/models/Group";
import {IGroup} from "@/types/models/group";
import User from "@/db/models/user";
import dbConnect from "@/lib/dbConnect";
import {isUserInGroup} from "@/lib/groupAuth";
import {NextRequest, NextResponse} from "next/server";
import {AuthedContext, withAuthAndErrors} from "@/lib/api/withAuth";
import {ForbiddenError, NotFoundError} from "@/lib/api/errorHandling";

export const DELETE = withAuthAndErrors(
    async (
        req: NextRequest,
        {params, userId}: AuthedContext<{ params: { groupId: string; memberId: string } }>
    ) => {
        const {groupId, memberId} = params;

        await dbConnect();

        await isUserInGroup(userId, groupId);

        const member = await User.findById(memberId);
        const user = await User.findById(userId);
        const group = await Group.findById(groupId);
        if (!member || !user || !group) {
            throw new NotFoundError("User or group not found");
        }

        if (!group.admin.equals(user._id) || userId !== memberId) {
            throw new ForbiddenError("You are not the admin of this group");
        }

        group.members = group.members.filter(
            (member: IGroup["members"][number]) => member.user.toString() !== memberId
        );

        //if admin left group, find another admin that joined first
        if (group.admin.equals(user._id)) {
            const newAdmin = group.members.sort(
                (a: IGroup["members"][number], b: IGroup["members"][number]) =>
                    a.joinedAt.getTime() - b.joinedAt.getTime()
            )[0];
            group.admin = newAdmin.user;
        }
        await group.save();

        member.groups = member.groups.filter((g: string) => g !== groupId);
        await member.save();

        if (group.members.length === 0) {
            await Group.findByIdAndDelete(groupId);
            return NextResponse.json({message: "Group deleted"}, {status: 200});
        }

        return NextResponse.json(group, {status: 200});
    }
);
