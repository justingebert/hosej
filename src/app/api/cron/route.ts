import mongoose from "mongoose";
import dbConnect from "@/db/dbConnect";
import Question from "@/db/models/Question";
import user from "@/db/models/user";
import { NextRequest, NextResponse } from 'next/server'

export const revalidate = 0
//TODO questions left parameters

async function selectDailyQuestions(limit: number) {
    await dbConnect();

    await Question.updateMany(
        { category: "Daily", used: true, active: true },
        { $set: { active: false } }
    );
    
    // Fetch new questions
    const questions = await Question.find({ category: "Daily", used: false, active: false })
                                    .limit(limit)
                                    .exec();

    // Activate questions
    for (const question of questions) {
        question.active = true;
        question.used = true;
        await question.save();
    }
   
    return questions;
}

export async function GET(req: Request) {
    const count = 2;

    await dbConnect();
    try {
        const questions = await selectDailyQuestions(count);
        if (!questions.length) {
            return NextResponse.json({ message: "No questions available" });
        }
        
        //populate questions
        for (const question of questions) {
            if (question.questionType.startsWith("users-")) {
                const users = await user.find({});
                question.options = await users.map(u => u.username);
                await question.save();
            }
            if (question.questionType.startsWith("rating")) {
                question.options = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
                await question.save();
            }
        }

        return NextResponse.json({ questions });
    } catch (error:any) {
        console.error('Error:', error); 
        return NextResponse.json({ message: error.message || 'An error occurred', error })
    }
}
