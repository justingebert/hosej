import dbConnect from "@/lib/dbConnect";
import { isUserInGroup } from "@/lib/groupAuth";
import { withErrorHandling } from "@/lib/apiMiddleware";
import { Group, Question } from "@/db/models";

export const revalidate = 0;
async function getHistoryHandler(req: Request, { params }: { params: { groupId: string } }) {
    const { groupId } = params;
    const userId = req.headers.get("x-user-id") as string;

    const group = await Group.findById(groupId);
    if (!group) {
        return Response.json({ message: "Group not found" }, { status: 404 });
    }

    const authCheck = await isUserInGroup(userId, groupId);
    if (!authCheck.isAuthorized) {
        return Response.json({ message: authCheck.message }, { status: authCheck.status });
    }

    await dbConnect();

    const url = new URL(req.url);
    const limit = url.searchParams.get("limit") || "10";
    const offset = url.searchParams.get("offset") || "0";

    const questions = await Question.find({
        groupId: groupId,
        used: true,
        active: false,
        category: "Daily",
    })
        .skip(parseInt(offset))
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });
    if (!questions) {
        return Response.json({ questions: [], message: "No questions found" });
    }

    return Response.json({ questions }, { status: 200 });
}

export const GET = withErrorHandling(getHistoryHandler);
