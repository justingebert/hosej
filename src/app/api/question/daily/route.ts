import mongoose from "mongoose";
import dbConnect from "@/db/dbConnect";
import Question from "@/db/models/Question";
import user from "@/db/models/user";
import { NextResponse } from 'next/server'

//TODO questions left parameters
export const revalidate = 0

async function getDailyQuestion() {
    await dbConnect();
  
    let question = await Question.findOne({ category: "Daily", used: true, active: true});
    if (!question) {
        return undefined;
    }
  
    return question;
  }

export async function GET(req: Request){
    await dbConnect();
    try{
        
        const question = await getDailyQuestion();
        if (!question) {
            return NextResponse.json({ message: "No questions available" });
        }
        
        const populatedQuestion = await Question.findById(question._id)
            .populate({
                path: 'answers.username', 
                select: 'username -_id'
            }).exec();
            if (populatedQuestion.questionType.startsWith("users-")) {
                const users = await user.find({});
                populatedQuestion.options = users.map(user => user.username);
                await populatedQuestion.save();
            }
            if (populatedQuestion.questionType.startsWith("rating")) {
                populatedQuestion.options = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
                populatedQuestion.save();
            }
        
        return NextResponse.json({ question: populatedQuestion });
    }
    catch (error) {
        return NextResponse.json({ message: error });
    }
}