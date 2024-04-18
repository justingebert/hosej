import mongoose from "mongoose";
import dbConnect from "@/db/dbConnect";
import Question from "@/db/models/Question";
import user from "@/db/models/user";
import { NextResponse } from 'next/server'

export const revalidate = 0
//TODO questions left parameters

async function selectDailyQuestion() {
    await dbConnect();

    const oldQuestion = await Question.findOne({ category: "Daily", used: true, active: true});
    if (oldQuestion) {
        oldQuestion.active = false;
        await oldQuestion.save();
    }
  
    let question = await Question.findOne({ category: "Daily", used: false, active: false});
    console.log(question)
    if (!question) {
        return undefined;
    }

    question.active = true;
    question.used = true;
    await question.save();
    
    console.log(question)

    return question;
  }

export async function GET(req: Request){
    await dbConnect();
    try{
        const question = await selectDailyQuestion();
        console.log(question)
        if (question === undefined) {
            return NextResponse.json({ message: "No questions available"});
        }
        if (question.questionType.startsWith("users-")) {
            const users = await user.find({}); 
            question.options = users.map(user => user.username);
            question.save();
        }
        if (question.questionType.startsWith("rating")) {
            question.options = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
            question.save();
        }

        return NextResponse.json({ question });
    }
    catch (error) {
        return NextResponse.json({ message: error });
    }
}