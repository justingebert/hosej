import dbConnect from "@/lib/dbConnect";
import Question from "@/db/models/Question";
import {type NextRequest, NextResponse} from 'next/server';
import {isUserInGroup} from "@/lib/groupAuth";
import {AuthedContext, withAuthAndErrors} from "@/lib/api/withAuth";
import {NotFoundError, ValidationError} from "@/lib/api/errorHandling";

export const revalidate = 0;

// Handle rating update
export const POST = withAuthAndErrors(async (req: NextRequest, {params, userId}: AuthedContext<{
    params: { groupId: string, questionId: string }
}>) => {
    const {groupId, questionId} = params;

    await dbConnect();

    await isUserInGroup(userId, groupId);

    const data = await req.json();
    const {rating} = data as { rating: 'good' | 'ok' | 'bad' };
    if (!['good', 'ok', 'bad'].includes(rating)) {
        throw new ValidationError('rating must be one of good | ok | bad');

    }

    const question = await Question.findById(questionId);
    if (!question) {
        throw new NotFoundError('Question not found');
    }

    if (question.rating.good.includes(userId) || question.rating.ok.includes(userId) || question.rating.bad.includes(userId)) {
        return NextResponse.json({message: "User already rated"}, {status: 304});
    }

    if (rating === "good") {
        question.rating.good.push(userId);
    } else if (rating === "ok") {
        question.rating.ok.push(userId);
    } else if (rating === "bad") {
        question.rating.bad.push(userId);
    }
    await question.save();

    return NextResponse.json({message: "Rating added"});
});
