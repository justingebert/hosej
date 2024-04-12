import mongoose from "mongoose";
import dbConnect from "../../../../db/dbConnect";
import Question from "../../../../db/models/Question";
import { NextResponse } from 'next/server'



export async function GET(req: Request, res: NextResponse){
    await dbConnect();
    try{
        const question = await Question.findOne({ category: "Daily", used: false });
        if (!question) {
            return NextResponse.json({ message: "No questions available" });
        }
        if (question.questionType.startsWith("user-")) {
            const users = await User.find({}); // Fetch all users
            question.options = users.map(user => ({
                id: user._id,
                name: user.username // or whatever property you use to label the user
            }));
        }
        return NextResponse.json({ question });
    }
}