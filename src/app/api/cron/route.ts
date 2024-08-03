import dbConnect from "@/lib/dbConnect";
import Question, { IQuestion } from "@/db/models/Question";
import user from "@/db/models/user";
import { NextResponse } from "next/server";
import {sendNotification} from "@/app/api/send-notification/route";

export const revalidate = 0;

//TODO seprate functions
//deactives current questions and activates new ones
async function selectDailyQuestions(limit: number): Promise<IQuestion[]> {
  try {
    await dbConnect();

    await Question.updateMany(
      { category: "Daily", used: true, active: true },
      { $set: { active: false } }
    );

    const questions = await Question.find({
      category: "Daily",
      used: false,
      active: false,
    }).limit(limit);

    for (const question of questions) {
      question.active = true;
      question.used = true;
      await question.save();
    }

    return questions;
  } catch (error: any) {
    console.error(error);
    return [];
  }
}

//gets, populates and returns daily questions
export async function GET(req: Request) {
  const count = 2; //TODO MOVE TO admin page
  
  try {
    await dbConnect();
    const questions = await selectDailyQuestions(count);
    if (!questions.length) {
      return NextResponse.json({ message: "No questions available" });
    }

    //TODO seprate function
    //populate questions
    for (const question of questions) {
      if (question.questionType.startsWith("users-")) {
        const users = await user.find({});
        question.options = await users.map((u) => u.username);
        await question.save();
      }
      if (question.questionType.startsWith("rating")) {
        question.options = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
        await question.save();
      }
    }

    await sendNotification('🚨HoseJ Fragen!!🚨', '🚨JETZT VOTEN DU FISCH🚨');
  
    return NextResponse.json({ questions });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({message: error});
  }
}
