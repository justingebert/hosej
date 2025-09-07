import {NextRequest, NextResponse} from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Question from '@/db/models/Question';
import {isUserInGroup} from '@/lib/groupAuth';
import {AuthedContext, withAuthAndErrors} from '@/lib/api/withAuth';
import {ForbiddenError, NotFoundError, ValidationError} from '@/lib/api/errorHandling';

export const POST = withAuthAndErrors(async (req: NextRequest, {params, userId}: AuthedContext<{
    params: { groupId: string, questionId: string }
}>) => {
    const {groupId, questionId} = params;

    const authCheck = await isUserInGroup(userId, groupId);
    if (!authCheck.isAuthorized) {
        if (authCheck.status === 404) throw new NotFoundError(authCheck.message || 'Group not found');
        throw new ForbiddenError(authCheck.message || 'Forbidden');
    }
    const {imageUrl} = await req.json();
    if (!imageUrl) {
        throw new ValidationError('Image URL is required');
    }
    await dbConnect();
    const question = await Question.findOne({groupId, _id: questionId});
    if (!question) {
        throw new NotFoundError('Question not found');
    }

    question.image = imageUrl;
    await question.save();

    return NextResponse.json({message: 'Image attached successfully'});
});
