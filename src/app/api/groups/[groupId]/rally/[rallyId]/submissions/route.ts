import dbConnect from "@/lib/dbConnect";
import { isUserInGroup } from "@/lib/groupAuth";
import { SUBMITTED_RALLY_POINTS } from "@/db/POINT_CONFIG";
import { Group, Rally, User } from "@/db/models";
import { withErrorHandling } from "@/lib/apiMiddleware";

export const revalidate = 0;

async function createRallySubmissionHandler(
    req: Request,
    { params }: { params: { groupId: string; rallyId: string } }
) {
    const { groupId, rallyId } = params;
    const userId = req.headers.get("x-user-id") as string;

    const group = await Group.findById(groupId);
    if (!group) {
        return Response.json({ message: "Group not found" }, { status: 404 });
    }

    const authCheck = await isUserInGroup(userId, groupId);
    if (!authCheck.isAuthorized) {
        return Response.json({ message: authCheck.message }, { status: authCheck.status });
    }
    const { imageUrl } = await req.json();

    await dbConnect();

    const rally = await Rally.findById(rallyId);
    if (!rally) {
        return Response.json({ message: "Rally not found" }, { status: 404 });
    }
    
    const sendUser = await User.findById(userId);
    const userAlreadySubmitted = rally.submissions.some(
        (submission) => submission.userId.toString() === sendUser._id.toString()
    );
    if (userAlreadySubmitted) {
        return Response.json({ message: "User already submitted" }, { status: 400 });
    }

    const newSubmission = {
        userId: sendUser._id,
        imageUrl: imageUrl,
        time: Date.now(),
    };

    await Rally.findByIdAndUpdate(
        rallyId,
        { $push: { submissions: newSubmission } },
        { new: true, runValidators: true }
    );


    await group.addPoints(sendUser._id, SUBMITTED_RALLY_POINTS);

    return Response.json({ message: "Picture submission added successfully" });
}

export const POST = withErrorHandling(createRallySubmissionHandler);
