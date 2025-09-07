import dbConnect from "@/lib/dbConnect";
import Question from "@/db/models/Question";
import {type NextRequest, NextResponse} from 'next/server'
import {isUserInGroup} from "@/lib/groupAuth";
import {generateSignedUrl} from "@/lib/question/questionOptions";
import {AuthedContext, withAuthAndErrors} from "@/lib/api/withAuth";
import {ForbiddenError, NotFoundError} from "@/lib/api/errorHandling";

export const GET = withAuthAndErrors(async (req: NextRequest, {params, userId}: AuthedContext<{
    params: { groupId: string, questionId: string }
}>) => {
    const {questionId, groupId} = params

    const authCheck = await isUserInGroup(userId, groupId);
    if (!authCheck.isAuthorized) {
        if (authCheck.status === 404) throw new NotFoundError(authCheck.message || 'Group not found');
        throw new ForbiddenError(authCheck.message || 'Forbidden');
    }
    await dbConnect();

    let question = await Question.findOne({groupId: groupId, _id: questionId});
    if (!question) throw new NotFoundError('Question not found');

    if (question.image) {
        const {url} = await generateSignedUrl(new URL(question.image).pathname);
        question = {
            ...question.toObject(),
            imageUrl: url,
        } as any;
    }
    if (question.questionType.startsWith("image")) {
        (question as any).options = await Promise.all(
            question.options.map(async (option: any) => {
                if (!option.key) throw new Error("Option is empty");
                return await generateSignedUrl(option.key, 60);
            })
        );
    }

    return NextResponse.json(question);
});
