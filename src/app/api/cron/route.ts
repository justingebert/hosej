import dbConnect from "@/lib/dbConnect";
import Question, { IQuestion } from "@/db/models/Question";
import user from "@/db/models/user";
import { NextResponse } from "next/server";

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

    console.log(`${process.env.NEXT_PUBLIC_API_URL}/api/send-notification`);
    const notificationResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/send-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title: '🚨HoseJ Fragen!!🚨', body: '🚨JETZT VOTEN DU FISCH🚨' }),
      cache: 'no-cache'
    });
  
    if (!notificationResponse.ok) {
      throw new Error('Failed to send notification');
    }

    return NextResponse.json({ questions });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({message: error});
  }
}
