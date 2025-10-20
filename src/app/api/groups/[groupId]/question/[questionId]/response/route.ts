import dbConnect from "@/lib/dbConnect";
import Question from "@/db/models/Question";
import { NextRequest, NextResponse } from 'next/server'
import Group from "@/db/models/Group";
import { isUserInGroup } from "@/lib/groupAuth";
import { VOTED_QUESTION_POINTS } from "@/db/POINT_CONFIG";
import { AuthedContext, withAuthAndErrors } from "@/lib/api/withAuth";
import { ConflictError, ValidationError } from "@/lib/api/errorHandling";

export const revalidate = 0

/**
 * Handles submitting a response on a question within a group.
 *
 */
export const POST = withAuthAndErrors(async (req: NextRequest, {params, userId}: AuthedContext<{
    params: { groupId: string, questionId: string }
}>) => {
    const {groupId, questionId} = params;

    await dbConnect();
    await isUserInGroup(userId, groupId);

    const data = await req.json();
    const {response} = data as { response: any };
    if (response === undefined || response === null || (Array.isArray(response) && response.length === 0)) {
        throw new ValidationError('response is required');
    }

    const question = await Question.findById(questionId).orFail();

    const userHasVoted = question.answers.some((answer) =>
        answer.user.equals(userId)
    );
    if (userHasVoted) {
        throw new ConflictError("You have already voted")
    }

    await Question.findByIdAndUpdate(
        questionId,
        {$push: {answers: {user: userId, response: response, time: Date.now()}}},
        {new: true, runValidators: true}
    );

    const group = await Group.findById(groupId).orFail()
    await group.addPoints(userId, VOTED_QUESTION_POINTS);

    return NextResponse.json({message: "Vote submitted"}, {status: 200});
});
