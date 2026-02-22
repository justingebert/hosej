import dbConnect from "@/db/dbConnect";
import Rally from "@/db/models/Rally";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import Group from "@/db/models/Group";
import { isUserAdmin } from "@/lib/services/admin";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { NotFoundError } from "@/lib/api/errorHandling";

export const POST = withAuthAndErrors(
    async (
        req: NextRequest,
        {
            params,
            userId,
        }: AuthedContext<{
            params: { groupId: string };
        }>
    ) => {
        const { groupId } = params;

        await dbConnect();
        await isUserAdmin(userId, groupId);

        const group = await Group.findById(groupId);
        if (!group) throw new NotFoundError("Group not found");

        const activeRallies = await Rally.find({ groupId: groupId, active: true });
        if (activeRallies.length >= group.features.rallies.settings.rallyCount) {
            return NextResponse.json(
                { message: "rallies already active", rallies: activeRallies },
                { status: 200 }
            );
        }
        const countToActivate = group.features.rallies.settings.rallyCount - activeRallies.length;

        const rallies = await Rally.find({ groupId: groupId, active: false, used: false }).limit(
            countToActivate
        );
        const currentTime = new Date();
        for (const rally of rallies) {
            rally.active = true;
            rally.startTime = new Date(currentTime.getTime());
            rally.endTime = new Date(
                rally.startTime.getTime() + rally.lengthInDays * 24 * 60 * 60 * 1000
            );
            await rally.save();
        }

        return NextResponse.json(
            { message: "Activated rallies", rallies: rallies },
            { status: 200 }
        );
    }
);
