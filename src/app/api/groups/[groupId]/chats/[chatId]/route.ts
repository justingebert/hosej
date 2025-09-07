import {NextRequest, NextResponse} from 'next/server';
import dbConnect from "@/lib/dbConnect";
import Chat from "@/db/models/Chat";
import User from '@/db/models/user';
import {isUserInGroup} from '@/lib/groupAuth';
import {AuthedContext, withAuthAndErrors} from '@/lib/api/withAuth';
import {ForbiddenError, NotFoundError} from '@/lib/api/errorHandling';

export const GET = withAuthAndErrors(async (req: NextRequest, {params, userId}: AuthedContext<{
    params: { groupId: string, chatId: string }
}>) => {
    const {groupId, chatId} = params;

    const authCheck = await isUserInGroup(userId, groupId);
    if (!authCheck.isAuthorized) {
        if (authCheck.status === 404) throw new NotFoundError(authCheck.message || 'Group not found');
        throw new ForbiddenError(authCheck.message || 'Forbidden');
    }

    await dbConnect();
    await User.findOne();
    const chat = await Chat.findById(chatId).populate('messages.user');
    if (!chat) {
        throw new NotFoundError('Chat not found');
    }

    return NextResponse.json(chat, {status: 200});
});
