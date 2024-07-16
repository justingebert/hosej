import { NextResponse } from 'next/server'
import dbConnect from "@/lib/dbConnect";
import user from "@/db/models/user";
import Question from '@/db/models/Question';
import ChatMessage from '@/db/models/chatmessage';
import Rally from '@/db/models/rally';

export const revalidate = 0

export async function GET(req: Request, res: NextResponse) {
  await dbConnect();


  const userCount = await user.countDocuments({});
  const questionCount = await Question.countDocuments({});
  const questionsLeftCount = await Question.countDocuments({ used: false });
  const messagesCount = await ChatMessage.countDocuments({});
  const RallyCount = await Rally.countDocuments({});
  const RalliesLeftCount = await Rally.countDocuments({ used: false });

  return NextResponse.json({ userCount, questionCount, questionsLeftCount, messagesCount, RallyCount, RalliesLeftCount });
}

