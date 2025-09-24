import dbConnect from "@/lib/dbConnect";
import Rally from "@/db/models/rally";
import {NextRequest, NextResponse} from 'next/server'
import User from "@/db/models/user";
import Group from "@/db/models/Group";
import {isUserInGroup} from "@/lib/groupAuth";
import {VOTED_RALLY_POINTS} from "@/db/POINT_CONFIG";
import {AuthedContext, withAuthAndErrors} from "@/lib/api/withAuth";

//vote on a submission
export const POST = withAuthAndErrors(async (req: NextRequest, {params, userId}: AuthedContext<{
    params: { groupId: string, rallyId: string, submissionId: string }
}>) => {
    const {groupId, rallyId, submissionId} = params;

    await dbConnect();
    await isUserInGroup(userId, groupId);

    const user = await User.findById(userId).orFail();
    const group = await Group.findById(groupId)

    const rally = await Rally.findOne({groupId: groupId, _id: rallyId});
    if (!rally) {
        return NextResponse.json({message: 'Rally not found'}, {status: 404});
    }
    const submission = rally.submissions.id(submissionId);
    if (!submission) {
        return NextResponse.json({message: 'Submission not found'});
    }
    const userVoted = submission.votes.find((vote:any) => vote.user === user._id);
    if (userVoted) {
        return NextResponse.json({message: 'User already voted'}, {status: 304});
    }
    submission.votes.push({user: user._id, time: Date.now()});

    await rally.save();

    await group.addPoints(user._id, VOTED_RALLY_POINTS);

    return NextResponse.json("Vote added successfully")
})