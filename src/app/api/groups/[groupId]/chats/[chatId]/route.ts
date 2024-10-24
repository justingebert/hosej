import { NextRequest, NextResponse } from 'next/server';
import dbConnect from "@/lib/dbConnect";
import Chat from "@/db/models/Chat";
import User from '@/db/models/user';
import { isUserInGroup } from '@/lib/groupAuth';

export async function GET(req: NextRequest, { params }: { params: { groupId:string, chatId: string } }) {
  const { groupId, chatId } = params;
  const userId = req.headers.get('x-user-id') as string;
  
  try {
    const authCheck = await isUserInGroup(userId, groupId);
    if (!authCheck.isAuthorized) {
      return NextResponse.json({ message: authCheck.message }, { status: authCheck.status });
    }

    await dbConnect();
    await User.findOne();
    const chat = await Chat.findById(chatId).populate('messages.user');
    if (!chat) {
      return NextResponse.json({ message: 'Chat not found' }, { status: 404 });
    }

    return NextResponse.json(chat, { status: 200 });
  } catch (error) {
    console.error('Error fetching chat:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
