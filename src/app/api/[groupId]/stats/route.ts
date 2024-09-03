import dbConnect from "@/lib/dbConnect";
import User from "@/db/models/user";
import Question from '@/db/models/Question';
import Rally from '@/db/models/rally';
import { NextRequest, NextResponse } from "next/server";
import Chat from "@/db/models/Chat";
export const revalidate = 0

export async function GET(req: NextRequest, { params }: { params: { groupId: string } }) {
  await dbConnect();
  const { groupId } = params;

  const userCount = await User.countDocuments({groups: groupId});
  const questionsUsedCount = await Question.countDocuments({groupId: groupId, used: true});
  const questionsLeftCount = await Question.countDocuments({ groupId: groupId, used: false });
  
  const chatCountInGroup = await Chat.countDocuments({ group: groupId });
  const messagesCount = await Chat.aggregate([
    { $match: { group: mongoose.Types.ObjectId(groupId) } }, // Match the group ID
    { $unwind: "$messages" }, // Deconstruct the messages array
    { $count: "totalMessages" } // Count the number of messages
]);

  const RalliesUsedCount = await Rally.countDocuments({ groupId: groupId, used: true });
  const RalliesLeftCount = await Rally.countDocuments({ groupId: groupId, used: false });

  return NextResponse.json({ userCount, questionsUsedCount, questionsLeftCount, messagesCount, RalliesUsedCount, RalliesLeftCount });
}

