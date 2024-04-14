import mongoose from "mongoose";
import dbConnect from "../../../../db/dbConnect";
import Question from "../../../../db/models/Question";
import User from "../../../../db/models/User";
import { NextResponse } from 'next/server'

export async function POST(req: Request, res: NextResponse){
    await dbConnect();
    const { questionId, option, username } = JSON.parse(req.body);
    const question = await Question.findById(questionId);
    if (!question) {
        return NextResponse.json({ message: "Question not found" });
    }
    const updatedQuestion = await Question.findByIdAndUpdate(
        questionId,
        { $push: { answers: { username, response: option } } },
        { new: true, runValidators: true }
    );


}