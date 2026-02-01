import dbConnect from "@/db/dbConnect";
import Question from "@/db/models/Question";
import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import User from "@/db/models/user";
import Group from "@/db/models/Group";
import { isUserInGroup } from "@/lib/userAuth";
import { VOTED_QUESTION_POINTS } from "@/config/POINT_CONFIG";
import type { AuthedContext} from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { NotFoundError, ValidationError } from "@/lib/api/errorHandling";

export const revalidate = 0;

//vote on a question
export const POST = withAuthAndErrors(
    async (
        req: NextRequest,
        {
            params,
            userId,
        }: AuthedContext<{
            params: { groupId: string; questionId: string };
        }>
    ) => {
        const { groupId, questionId } = params;

        await dbConnect();
        await isUserInGroup(userId, groupId);

        const data = await req.json();
        const { response } = data as { response: any };
        if (
            response === undefined ||
            response === null ||
            (Array.isArray(response) && response.length === 0)
        ) {
            throw new ValidationError("response is required");
        }

        const question = await Question.findById(questionId);
        if (!question) {
            throw new NotFoundError("Question not found");
        }
        const user = await User.findById(userId);
        if (!user) throw new NotFoundError("User not found");

        const hasVoted = question.answers.some((answer: any) => answer.user.equals(user._id));
        if (hasVoted) {
            return NextResponse.json({ message: "You have already voted" }, { status: 304 });
        }

        await Question.findByIdAndUpdate(
            questionId,
            { $push: { answers: { user: user._id, response: response, time: Date.now() } } },
            { new: true, runValidators: true }
        );

        const group = await Group.findById(groupId);
        if (!group) throw new NotFoundError("Group not found");
        await group.addPoints(user._id, VOTED_QUESTION_POINTS);

        return NextResponse.json({ message: "Vote submitted" }, { status: 200 });
    }
);
