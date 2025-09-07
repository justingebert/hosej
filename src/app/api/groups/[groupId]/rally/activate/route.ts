import dbConnect from "@/lib/dbConnect";
import Rally from "@/db/models/rally";
import {NextRequest, NextResponse} from "next/server";
import Group from "@/db/models/Group";
import {isUserAdmin} from "@/lib/groupAuth";
import {AuthedContext, withAuthAndErrors} from "@/lib/api/withAuth";
import {ForbiddenError, NotFoundError} from "@/lib/api/errorHandling";

export const POST = withAuthAndErrors(async (req: NextRequest, {params, userId}: AuthedContext<{
    params: { groupId: string }
}>) => {
    const {groupId} = params;

    const authCheck = await isUserAdmin(userId, groupId);
    if (!authCheck.isAuthorized) {
        if (authCheck.status === 404) throw new NotFoundError(authCheck.message || 'Group not found');
        throw new ForbiddenError(authCheck.message || 'Forbidden');
    }

    await dbConnect();
    const group = await Group.findById(groupId);
    if (!group) throw new NotFoundError('Group not found');

    const activeRallies = await Rally.find({groupId: groupId, active: true})
    if (activeRallies.length >= group.rallyCount) {
        return NextResponse.json({message: "rallies already active", rallies: activeRallies}, {status: 200});
    }
    const countToActivate = group.rallyCount - activeRallies.length;

    const rallies = await Rally.find({groupId: groupId, active: false, used: false}).limit(countToActivate);
    const currentTime = new Date();
    for (let rally of rallies) {
        rally.active = true;
        rally.startTime = new Date(currentTime.getTime());
        rally.endTime = new Date(rally.startTime.getTime() + rally.lengthInDays * 24 * 60 * 60 * 1000);
        await rally.save();
    }

    return NextResponse.json({message: "Activated rallies", rallies: rallies}, {status: 200});
});
