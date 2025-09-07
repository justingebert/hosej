import dbConnect from "@/lib/dbConnect";
import Question from "@/db/models/Question";
import {type NextRequest, NextResponse} from 'next/server'
import {isUserInGroup} from "@/lib/groupAuth";
import {generateSignedUrl} from "@/lib/generateSingledUrl";
import {AuthedContext, withAuthAndErrors} from "@/lib/api/withAuth";
import {NotFoundError} from "@/lib/api/errorHandling";

export const GET = withAuthAndErrors(async (req: NextRequest, {params, userId}: AuthedContext<{
    params: { groupId: string, questionId: string }
}>) => {
    const {questionId, groupId} = params

    await dbConnect();
    await isUserInGroup(userId, groupId);

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
