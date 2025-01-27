import dbConnect from "@/lib/dbConnect";
import Question from "@/db/models/Question";
import { IQuestion } from "@/types/Question";
import { NextResponse } from "next/server";
import { sendNotification } from "@/utils/sendNotification";
import Group from "@/db/models/Group";
import Jukebox from "@/db/models/Jukebox";

export const revalidate = 0;
//deactives current questions and activates new ones
async function selectDailyQuestions(groupId:string, limit: number): Promise<IQuestion[]> {
  let questions: IQuestion[] = [];
  try {
    await dbConnect();

    const currentQuestions = await Question.find({groupId: groupId, category: "Daily", active: true});
    for (const question of currentQuestions) {
      question.active = false;
      await question.save();
    }

    questions = await Question.find({
      groupId: groupId,
      category: "Daily",
      used: false,
      active: false,
    }).limit(limit);

    for (const question of questions) {
      question.active = true;
      question.used = true;
      question.usedAt = new Date();
      await question.save();
    }

    return questions;
  
  } catch (error: any) {
    throw new Error(error);
  }
}

//gets, populates and returns daily questions
export async function GET(req: Request) {
  try {
    await dbConnect();

    const groups = await Group.find({});
    //TODO this sends multiple notifications to one user this is wrong
    for(const group of groups){
      
        const questions = await selectDailyQuestions(group._id, group.questionCount);
        if(questions.length === 0){
          await sendNotification('🥗DA HABEN WIR DEN SALAT🥗', `${group.name} HAT KEINE FRAGEN MEHR, AN DIE ARBEIT!!`, group._id);
          await group.save();
        }else{
          await sendNotification(`🚨Neue ${group.name} Fragen!!🚨`, '🚨JETZT VOTEN DU FISCH🚨', group._id);
          group.lastQuestionDate = new Date();
          await group.save();
        }

        //jukebox logic

        const today = new Date();
        const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(today);
        if(today.getDate() === 15){
          await new Jukebox({groupId: group._id, date: today, active: true}).save();
          await Jukebox.findOneAndUpdate({active: true, groupId: group._id}, {active: false});
          await sendNotification(`🎶JUKEBOX - ${monthName} 🎶`, '🎶JETZT SONG ADDEN DU EI🎶', group._id);
        }
    }

    return NextResponse.json({ message: "cron exceuted successfully" }, {status: 200});
  } catch (error: any) {
    console.error("Error in cron job", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
