import dbConnect from "@/lib/dbConnect";
import Question, { IQuestion } from "@/db/models/Question";
import User from "@/db/models/user";
import { NextResponse } from "next/server";
import { sendNotification } from "@/utils/sendNotification";
import Group from "@/db/models/Group";

export const revalidate = 0;

//TODO seprate functions
//deactives current questions and activates new ones
async function selectDailyQuestions(groupId:string, limit: number): Promise<void> {
  try {
    await dbConnect();

    const currentQuestions = await Question.find({groupId: groupId, category: "Daily", active: true});
    for (const question of currentQuestions) {
      question.active = false;
      await question.save();
    }

    const questions = await Question.find({
      groupId: groupId,
      category: "Daily",
      used: false,
      active: false,
    }).limit(limit);

    for (const question of questions) {
      question.active = true;
      question.used = true;
      //TODO remove when migration is complete
      if (question.questionType.startsWith("users-")) {
        const users = await User.find({});
        question.options = await users.map((u) => u.username);
        await question.save();
      }
      if (question.questionType.startsWith("rating")) {
        question.options = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
        await question.save();
      }
      await question.save();
    }

  } catch (error: any) {
    console.error(error);
  }
}

//gets, populates and returns daily questions
export async function GET(req: Request) {
  const count = 2; //TODO MOVE TO admin page
  
  try {
    await dbConnect();

    const groups = await Group.find({});

    for(const group of groups){
        await selectDailyQuestions(group._id, group.questionCount);
    }

    await sendNotification('🚨HoseJ Fragen!!🚨', '🚨JETZT VOTEN DU FISCH🚨');
  
    return NextResponse.json({ message: "success" });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({message: error});
  }
}
