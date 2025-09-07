import {NextRequest, NextResponse} from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Question from '@/db/models/Question';
import {isUserInGroup} from '@/lib/groupAuth';
import {AuthedContext, withAuthAndErrors} from '@/lib/api/withAuth';
import {NotFoundError, ValidationError} from '@/lib/api/errorHandling';

export const POST = withAuthAndErrors(async (req: NextRequest, {params, userId}: AuthedContext<{
    params: { groupId: string, questionId: string }
}>) => {
    const {groupId, questionId} = params;

    await dbConnect();
    await isUserInGroup(userId, groupId);
    const {options} = await req.json();
    if (!options || !Array.isArray(options) || options.length === 0) {
        throw new ValidationError('Options are required');
    }


    const question = await Question.findOne({groupId, _id: questionId});
    if (!question) {
        throw new NotFoundError('Question not found');
    }

    question.options = options;
    await question.save();

    return NextResponse.json({message: 'Image attached successfully'}, {status: 200});
})
