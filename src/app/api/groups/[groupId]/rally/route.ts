import dbConnect from "@/lib/dbConnect";
import Rally from "@/db/models/rally";
import { NextRequest, NextResponse } from "next/server";
import User from "@/db/models/user";
import { sendNotification } from "@/utils/sendNotification";
import Chat from "@/db/models/Chat";
import Group from "@/db/models/Group";
import { isUserInGroup } from "@/lib/groupAuth";
import { CREATED_RALLY_POINTS } from "@/db/POINT_CONFIG";
import { AuthedContext, withAuthAndErrors } from "@/lib/api/withAuth";
import { NotFoundError, ValidationError } from "@/lib/api/errorHandling";

export const revalidate = 0;

//get current rally and set state
export const GET = withAuthAndErrors(async (req: NextRequest, { params, userId }: AuthedContext<{
    params: { groupId: string }
}>) => {
    const { groupId } = params;


    await dbConnect();
    await isUserInGroup(userId, groupId);


    const group = await Group.findById(groupId);
    if (!group) throw new NotFoundError('Group not found');

    const currentTime = new Date();

    const rallies = await Rally.find({ groupId: groupId, active: true })
    if (rallies.length === 0) {
        return NextResponse.json({ message: "No active rallies", rallies: [] }, { status: 200 });
    }

    for (let rally of rallies) {
        const endTime = new Date(rally.endTime);
        const startTime = new Date(rally.startTime);

        // start rally
        if (!rally.used && currentTime >= startTime && !rally.votingOpen && !rally.resultsShowing) {
            rally.used = true;
            await rally.save();

            await sendNotification(`📷 New ${group.name} Rally Started! 📷`, '📷 PARTICIPATE NOW! 📷', group._id);
            continue;
        }

        if (currentTime < endTime) continue;
        // set state of running rally
        // Voting phase: if current time is after the rally's endTime and voting is not yet open
        if (!rally.votingOpen && !rally.resultsShowing) {
            rally.votingOpen = true;
            rally.endTime = new Date(currentTime.getTime() + 24 * 60 * 60 * 1000); // 1 day for voting
            await rally.save();

            await sendNotification(`📷${group.name} Rally Voting! 📷`, '📷 VOTE NOW 📷', group._id);
        }
        // Results phase: if voting is over, but the rally is still active
        else if (rally.votingOpen && !rally.resultsShowing) {
            rally.votingOpen = false;
            rally.resultsShowing = true
            rally.endTime = new Date(currentTime.getTime() + 24 * 60 * 60 * 1000); // 1 day for results viewing
            await rally.save();

            await sendNotification(`📷 ${group.name} Rally Results! 📷`, '📷 VIEW NOW 📷', group._id);
        }
        // end rally and active new ones
        else if (rally.resultsShowing && !rally.votingOpen) {
            rally.resultsShowing = false;
            rally.active = false;
            rally.endTime = currentTime;
            await rally.save();
            // After results viewing day, set gap phase
            const gapEndTime = new Date(currentTime.getTime() + group.features.rallies.settings.rallyGapDays * 24 * 60 * 60 * 1000);

            // Start a new rally after the gap phase
            const newRally = await Rally.findOne({
                groupId: groupId,
                active: false,
                used: false,
            });

            if (newRally) {
                newRally.active = true;
                newRally.startTime = gapEndTime; // New rally starts after the gap phase
                newRally.endTime = new Date(gapEndTime.getTime() + newRally.lengthInDays * 24 * 60 * 60 * 1000); // Set end time based on lengthInDays
                await newRally.save();
                await sendNotification(`📷 ${group.name} Rally finished! 📷`, `📷 Next Rally starting: ${newRally.startTime.toLocaleString()}📷`, group._id);
            } else {
                return NextResponse.json({ message: "No rallies left", rallies: [] }, { status: 200 });
            }
        }
    }
    // return rallies that are currently running and are not in gaptime
    const currentRallies = rallies.filter(rally => currentTime >= new Date(rally.startTime));

    return NextResponse.json({ rallies: currentRallies });
});

//create rally
export const POST = withAuthAndErrors(async (req: NextRequest, { params, userId }: AuthedContext<{
    params: { groupId: string }
}>) => {
    const { groupId } = params;


    await dbConnect();
    await isUserInGroup(userId, groupId);

    const { task, lengthInDays } = await req.json();
    if (!task || !lengthInDays) {
        throw new ValidationError('task and lengthInDays are required');
    }

    const group = await Group.findById(groupId)
    const submittingUser = await User.findById(userId);
    if (!group || !submittingUser) throw new NotFoundError('Group or user not found');

    const newRally = new Rally({
        groupId: groupId,
        task: task,
        lengthInDays: lengthInDays,
        submittedBy: submittingUser._id,
    });
    await newRally.save();

    const newChat = new Chat({
        group: groupId,
        entity: newRally._id,
        entityModel: "Rally",
        messages: [],
    });
    await newChat.save();

    newRally.chat = newChat._id;
    await newRally.save();

    await group.addPoints(submittingUser._id, CREATED_RALLY_POINTS);

    return NextResponse.json({ message: "Rally created successfully" });
});
