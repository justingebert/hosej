import { Types } from 'mongoose';
import dbConnect from "@/lib/dbConnect";
import User from "@/db/models/user";
import Question from '@/db/models/Question';
import Rally from '@/db/models/rally';
import { NextRequest, NextResponse } from "next/server";
import Chat from "@/db/models/Chat";
import Group from '@/db/models/Group';
export const revalidate = 0

export async function GET(req: NextRequest, { params }: { params: { groupId: string } }) {
  await dbConnect();
  const { groupId } = params;

  const group = await Group.findById(groupId);

  const questionsUsedCount = await Question.countDocuments({groupId: groupId, used: true});
  const questionsLeftCount = await Question.countDocuments({ groupId: groupId, used: false });

  const questionsByType = await Question.aggregate([
    { $match: { groupId: (new Types.ObjectId(groupId) )} },
    { $group: { _id: "$questionType", count: { $sum: 1 } } }
  ]);

  const questionsByUser = await Question.aggregate([
    { 
      $match: { 
        groupId: new Types.ObjectId(groupId), 
        submittedBy: { $exists: true, $ne: null } 
      } 
    },
    { 
      $group: { 
        _id: "$submittedBy", 
        count: { $sum: 1 } 
      } 
    },
    {
      $sort: { count: -1 }  // Sort by count in descending order (largest first)
    }
  ]);



  const RalliesUsedCount = await Rally.countDocuments({ groupId: groupId, used: true });
  const RalliesLeftCount = await Rally.countDocuments({ groupId: groupId, used: false });
  
  const messages = await Chat.aggregate([
    { $match: { group: (new Types.ObjectId(groupId) )} }, // Match the group ID
    { $unwind: "$messages" }, // Deconstruct the messages array
    { $count: "messagesCount" } // Count the number of messages
  ]);
  const messagesCount = messages[0]?.messagesCount || 0;

  return NextResponse.json({ group, questionsUsedCount, questionsLeftCount, questionsByType, questionsByUser, RalliesUsedCount, RalliesLeftCount, messagesCount });
}

