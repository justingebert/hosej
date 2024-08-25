import dbConnect from "@/lib/dbConnect";
import User from "@/db/models/user";
import Question from '@/db/models/Question';
import ChatMessage from '@/db/models/chatmessage';
import Rally from '@/db/models/rally';
import { NextRequest, NextResponse } from "next/server";

export const revalidate = 0

export async function GET(req: NextRequest, { params }: { params: { groupId: string } }) {
  await dbConnect();
  const { groupId } = params;

  const userCount = await User.countDocuments({groups: groupId});
  const questionsUsedCount = await Question.countDocuments({groupId: groupId, used: true});
  const questionsLeftCount = await Question.countDocuments({ groupId: groupId, used: false });
  const messagesCount = await ChatMessage.countDocuments({});
  const RalliesUsedCount = await Rally.countDocuments({ groupId: groupId, used: true });
  const RalliesLeftCount = await Rally.countDocuments({ groupId: groupId, used: false });

  return NextResponse.json({ userCount, questionsUsedCount, questionsLeftCount, messagesCount, RalliesUsedCount, RalliesLeftCount });
}

