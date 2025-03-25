import dbConnect from "@/lib/dbConnect";
import { isUserInGroup } from "@/lib/groupAuth";
import { Group, Rally } from "@/db/models";
import { withErrorHandling } from "@/lib/apiMiddleware";
import { generateSignedUrl } from "@/lib/question/generateSignedUrl";

export const revalidate = 0;

async function getRallyHandler(req: Request, { params }: { params: { groupId: string; rallyId: string } }) {
    const userId = req.headers.get("x-user-id") as string;
    const { groupId, rallyId } = params;

    const group = await Group.findById(groupId);
    if (!group) {
        return Response.json({ message: "Group not found" }, { status: 404 });
    }

    const authCheck = await isUserInGroup(userId, groupId);
    if (!authCheck.isAuthorized) {
        return Response.json({ message: authCheck.message }, { status: authCheck.status });
    }

    await dbConnect();
    const rally = await Rally.findById(rallyId);
    if (!rally) {
        return Response.json({ message: "Rally not found" }, { status: 404 });
    }

    const submissions = await Promise.all(
        rally.submissions.map(async (submission: any) => {
            const { url } = await generateSignedUrl(new URL(submission.imageUrl).pathname);
            return {
                ...submission.toObject(),
                imageUrl: url,
            };
        })
    );

    rally.submissions = submissions.sort((a, b) => b.votes.length - a.votes.length);

    return Response.json(rally, { status: 200 });
}

export const GET = withErrorHandling(getRallyHandler);
