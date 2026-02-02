import dbConnect from "@/db/dbConnect";
import Rally from "@/db/models/Rally";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import User from "@/db/models/User";
import Group from "@/db/models/Group";
import { isUserInGroup } from "@/lib/userAuth";
import { VOTED_RALLY_POINTS } from "@/config/POINT_CONFIG";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";

//vote on a submission
export const POST = withAuthAndErrors(
    async (
        req: NextRequest,
        {
            params,
            userId,
        }: AuthedContext<{
            params: { groupId: string; rallyId: string; submissionId: string };
        }>
    ) => {
        const { groupId, rallyId, submissionId } = params;

        await dbConnect();
        await isUserInGroup(userId, groupId);

        const user = await User.findById(userId).orFail();
        const group = await Group.findById(groupId).orFail();

        const rally = await Rally.findOne({ groupId: groupId, _id: rallyId });
        if (!rally) {
            return NextResponse.json({ message: "Rally not found" }, { status: 404 });
        }
        const submission = rally.submissions.find((s) => s._id.toString() === submissionId);
        if (!submission) {
            return NextResponse.json({ message: "Submission not found" });
        }
        const userVoted = submission.votes.find((vote: any) => vote.user === user._id);
        if (userVoted) {
            return NextResponse.json({ message: "User already voted" }, { status: 304 });
        }
        submission.votes.push({ user: user._id, time: new Date() });

        await rally.save();

        await group.addPoints(user._id.toString(), VOTED_RALLY_POINTS);

        return NextResponse.json("Vote added successfully");
    }
);
