import dbConnect from "@/lib/dbConnect";
import { isUserInGroup } from "@/lib/groupAuth";
import { VOTED_RALLY_POINTS } from "@/db/POINT_CONFIG";
import { withErrorHandling } from "@/lib/apiMiddleware";
import { Group, Rally, User } from "@/db/models";

export async function voteRallyHandler(
    req: Request,
    { params }: { params: { groupId: string; rallyId: string } }
) {
    const { groupId, rallyId } = params;
    const userId = req.headers.get("x-user-id") as string;
    const { submissionId } = await req.json();

    await dbConnect();
    const group = await Group.findById(groupId);
    if(!group){
        return Response.json({message: "Group not found"}, { status: 404 })
    }

    const authCheck = await isUserInGroup(userId, groupId);
    if (!authCheck.isAuthorized) {
        return Response.json({ message: authCheck.message }, { status: authCheck.status });
    }

    const rally = await Rally.findOne({ groupId: groupId, _id: rallyId });
    if (!rally) {
        return Response.json({ message: "Rally not found" }, { status: 404 });
    }

    const submission = rally.submissions.id(submissionId);
    if (!submission) {
        return Response.json({ message: "Submission not found" }, { status: 404 });
    }

    const user = await User.findById(userId);
    const userVoted = submission.votes.find((vote: { user: string }) => vote.user === user._id);
    if (userVoted) {
        return Response.json({ message: "User already voted" }, { status: 304 });
    }

    submission.votes.push({ user: user._id, time: Date.now() });

    await rally.save();
    await group.addPoints(user._id, VOTED_RALLY_POINTS);

    return Response.json({message: "Vote added successfully"}, { status: 200 });
}

export const POST = withErrorHandling(voteRallyHandler);
