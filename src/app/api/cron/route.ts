import dbConnect from "@/lib/dbConnect";
import Question, { IQuestion } from "@/db/models/Question";
import User from "@/db/models/user";
import { NextResponse } from "next/server";
import { sendNotification } from "@/utils/sendNotification";
import Group from "@/db/models/Group";

export const revalidate = 0;

//TODO seprate functions
//deactives current questions and activates new ones
async function selectDailyQuestions(groupId:string, limit: number): Promise<IQuestion[]> {
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

    if(questions.length === 0){
      console.log("No questions found for group: ", groupId);
      return [];
    }

    for (const question of questions) {
      question.active = true;
      question.used = true;
      await question.save();
    }

    return questions;

  } catch (error: any) {
    console.error(error);
  }
  return [];
}

//gets, populates and returns daily questions
export async function GET(req: Request) {
  const count = 2; //TODO MOVE TO admin page
  
  try {
    await dbConnect();

    const groups = await Group.find({});


    //TODO this sends multiple notifications to one user this is wrong
    for(const group of groups){
        const questions = await selectDailyQuestions(group._id, group.questionCount);
        if(questions.length === 0){
          await sendNotification('🥗DA HABEN WIR DEN SALAT🥗', `${group.name} HAT KEINE FRAGEN MEHR, AN DIE ARBEIT!!`, group._id);
        }else{
          await sendNotification('Neue Fragen!!🚨', '🚨JETZT VOTEN DU FISCH🚨');
        }

    }

    return NextResponse.json({ message: "success" });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({message: error});
  }
}
