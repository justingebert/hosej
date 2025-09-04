import dbConnect from "@/lib/dbConnect";
import { isUserInGroup } from "@/lib/groupAuth";
import { CREATED_RALLY_POINTS } from "@/db/POINT_CONFIG";
import { withErrorHandling } from "@/lib/apiMiddleware";
import { Chat, Group, Rally, User } from "@/db/models";
import { generateSignedUrl } from "@/lib/generateSignedUrl";

export const revalidate = 0;

async function getRalliesHandler(req: Request, { params }: { params: { groupId: string } }) {
    const userId = req.headers.get("x-user-id") as string;
    const { groupId } = params;

    const authCheck = await isUserInGroup(userId, groupId);
    if (!authCheck.isAuthorized) {
        return Response.json({ message: authCheck.message }, { status: authCheck.status });
    }
    await dbConnect();

    const rallies = await Rally.find({ groupId: groupId, active: true, used: true });
    const processedRallies = await Promise.all(
        rallies.map(async (rally) => {
            const plainRally = rally.toObject();
            const needsImages = rally.votingOpen || rally.resultsShowing;

            const userHasVoted = rally.submissions?.some((s) => s.votes?.some((v) => v.user.toString() === userId));
            const userHasUploaded = rally.submissions?.some((s) => s.userId.toString() === userId);

            const processedRally = {
                ...plainRally,
                userHasVoted: userHasVoted,
                userHasUploaded: userHasUploaded,
            };

            if (needsImages && rally.submissions?.length > 0) {
                processedRally.submissions = await Promise.all(rally.submissions.map(processSubmission));
            }

            if (userHasVoted) {
                processedRally.submissions.sort((a, b) => (b.votes?.length || 0) - (a.votes?.length || 0));
            }

            return processedRally;
        })
    );

    return Response.json(processedRallies, { status: 200 });
}

async function processSubmission(submission: any) {
    if (!submission.imageUrl) {
        return submission.toObject();
    }

    const { url } = await generateSignedUrl(new URL(submission.imageUrl).pathname);
    return {
        ...submission.toObject(),
        imageUrl: url,
    };
}

async function createRallyHandler(req: Request, { params }: { params: { groupId: string } }) {
    const userId = req.headers.get("x-user-id") as string;
    const { groupId } = params;
    const { task, lengthInDays } = await req.json();

    const authCheck = await isUserInGroup(userId, groupId);
    if (!authCheck.isAuthorized) {
        return Response.json({ message: authCheck.message }, { status: authCheck.status });
    }

    await dbConnect();

    const group = await Group.findById(groupId);
    if (!group) {
        return Response.json({ message: "Group not found" }, { status: 404 });
    }
    const submittingUser = await User.findById(userId);

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

    return Response.json({ message: "Rally created successfully" }, { status: 201 });
}

export const GET = withErrorHandling(getRalliesHandler);
export const POST = withErrorHandling(createRallyHandler);
