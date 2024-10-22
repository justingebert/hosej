import { NextRequest, NextResponse } from 'next/server';
import dbConnect from "@/lib/dbConnect";
import Chat from "@/db/models/Chat";

export async function POST(req: NextRequest, { params }: { params: { groupId:string, chatId: string } }) {
  const { chatId } = params;

  await dbConnect();

  try {
    const body = await req.json();
    const { userId, message } = body;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return NextResponse.json({ message: 'Chat not found' }, { status: 404 });
    }

    chat.messages.push({ user: userId, message, createdAt: new Date() });
    await chat.save();

    const newMessage = chat.messages[chat.messages.length - 1];
    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    console.error('Error posting message:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
