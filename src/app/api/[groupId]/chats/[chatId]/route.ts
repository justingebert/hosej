import { NextRequest, NextResponse } from 'next/server';
import dbConnect from "@/lib/dbConnect";
import Chat from "@/db/models/Chat";
import User from '@/db/models/user';

export async function GET(req: NextRequest, { params }: { params: { groupId:string, chatId: string } }) {
  const { groupId, chatId } = params;

  await dbConnect();

  try {
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
