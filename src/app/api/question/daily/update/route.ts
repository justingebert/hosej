import mongoose from "mongoose";
import dbConnect from "../../../../../db/dbConnect";
import Question from "../../../../../db/models/Question";
import User from "../../../../../db/models/User";
import { NextResponse } from 'next/server'

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
  
    return question;
  }

export async function GET(req: Request){
    await dbConnect();
    try{
        const question = await selectDailyQuestion();
        console.log(question)
        if (!question) {
            return NextResponse.json({ message: "No questions available" });
        }
        if (question.questionType.startsWith("users-")) {
            const users = await User.find({}); 
            question.options = users.map(user => ({
                name: user.username
            }));
        }

        return NextResponse.json({ question });
    }
    catch (error) {
        return NextResponse.json({ message: error });
    }
}