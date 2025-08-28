import dbConnect from "@/lib/dbConnect";
import Question from "@/db/models/Question";
import User from "@/db/models/user";
import Group from "@/db/models/Group";
import { isUserInGroup } from "@/lib/groupAuth";
import { VOTED_QUESTION_POINTS } from "@/db/POINT_CONFIG";
import { withErrorHandling } from "@/lib/apiMiddleware";

export const revalidate = 0;

async function voteQuestionHandler(req: Request, { params }: { params: { groupId: string; questionId: string } }) {
    const { groupId, questionId } = params;
    const userId = req.headers.get("x-user-id") as string;

    await dbConnect();

    const group = await Group.findById(groupId);
    if (!group) {
        return Response.json({ message: "Group not found" }, { status: 404 });
    }

    const authCheck = await isUserInGroup(userId, groupId);
    if (!authCheck.isAuthorized) {
        return Response.json({ message: authCheck.message }, { status: authCheck.status });
    }

    const data = await req.json();
    const { response } = data;

    const question = await Question.findById(questionId);
    if (!question) {
        return Response.json({ message: "Question not found" }, { status: 404 });
    }
    const user = await User.findById(userId);

    const hasVoted = question.answers.some((answer: any) => answer.user.equals(user._id));
    if (hasVoted) {
        return Response.json({ message: "You have already voted" }, { status: 304 });
    }

    await Question.findByIdAndUpdate(
        questionId,
        { $push: { answers: { user: user._id, response: response, time: Date.now() } } },
        { new: true, runValidators: true }
    );

    await group.addPoints(user._id, VOTED_QUESTION_POINTS);

    return Response.json({ message: "Vote submitted" }, { status: 200 });
}

export const GET = withErrorHandling(voteQuestionHandler);
