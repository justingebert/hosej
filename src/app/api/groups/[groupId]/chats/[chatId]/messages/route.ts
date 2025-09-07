import {NextRequest, NextResponse} from 'next/server';
import dbConnect from "@/lib/dbConnect";
import Chat from "@/db/models/Chat";
import {isUserInGroup} from '@/lib/groupAuth';
import {AuthedContext, withAuthAndErrors} from '@/lib/api/withAuth';
import {ForbiddenError, NotFoundError, ValidationError} from '@/lib/api/errorHandling';

export const POST = withAuthAndErrors(async (req: NextRequest, {params, userId}: AuthedContext<{
    params: { groupId: string, chatId: string }
}>) => {
    const {groupId, chatId} = params;

    const authCheck = await isUserInGroup(userId, groupId);
    if (!authCheck.isAuthorized) {
        if (authCheck.status === 404) throw new NotFoundError(authCheck.message || 'Group not found');
        throw new ForbiddenError(authCheck.message || 'Forbidden');
    }

    await dbConnect();

    const body = await req.json();
    const {message} = body;
    if (!message || typeof message !== 'string' || message.trim() === '') {
        throw new ValidationError('Message is required');
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
        throw new NotFoundError('Chat not found');
    }

    chat.messages.push({user: userId, message, createdAt: new Date()});
    await chat.save();

    const newMessage = chat.messages[chat.messages.length - 1];
    return NextResponse.json(newMessage, {status: 201});
});
