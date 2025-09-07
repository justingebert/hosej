import {NextRequest, NextResponse} from 'next/server'
import dbConnect from "@/lib/dbConnect";
import User from '@/db/models/user';
import Group from '@/db/models/Group';
import {isUserInGroup} from '@/lib/groupAuth';
import {AuthedContext, withAuthAndErrors} from '@/lib/api/withAuth';
import {ConflictError, NotFoundError} from '@/lib/api/errorHandling';

export const revalidate = 0
//get user by id
export const GET = withAuthAndErrors(async (req: NextRequest, {params, userId}: AuthedContext<{
    params: { groupId: string }
}>) => {
    const {groupId} = params;

    await dbConnect();
    await isUserInGroup(userId, groupId);

    const group = await Group.findById(groupId).populate({path: 'members', model: User});
    if (!group) throw new NotFoundError('Group not found');

    return NextResponse.json(group.members, {status: 200});
});

export const POST = withAuthAndErrors(async (req: NextRequest, {params, userId}: AuthedContext<{
    params: { groupId: string }
}>) => {
    const {groupId} = params;

    await dbConnect();

    const user = await User.findById(userId);
    if (!user) {
        throw new NotFoundError('User not found');
    }

    const group = await Group.findById(groupId);
    if (!group) {
        throw new NotFoundError('Group not found');
    }

    const isMember = group.members.some((member: any) => member.user.toString() === userId);
    if (isMember) {
        throw new ConflictError('User is already a member of this group');
    }

    group.members.push({user: user._id, name: user.username});
    await group.save();

    if (!user.groups.includes(groupId)) {
        user.groups.push(groupId);
        await user.save();
    }

    return NextResponse.json({message: `User ${user.username} successfully joined the group`, group}, {status: 200});
});
