import mongoose from "mongoose";
import dbConnect from "../../../../db/dbConnect";
import Question from "../../../../db/models/Question";
import User from "../../../../db/models/User";
import { NextResponse } from 'next/server'

export async function GET(req: Request, res: NextResponse){
    await dbConnect();
    try{
        const question = await Question.findOne({ category: "Daily", used: false });
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