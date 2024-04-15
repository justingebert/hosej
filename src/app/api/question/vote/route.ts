import mongoose from "mongoose";
import dbConnect from "../../../../db/dbConnect";
import Question from "../../../../db/models/Question";
import User from "../../../../db/models/User";
import { NextResponse } from 'next/server'

export async function POST(req: Request){
    const data = await req.json();
    const { questionId, option, user } = data;
    await dbConnect();
    const question = await Question.findById(questionId);
    if (!question) {
        
        return NextResponse.json({ message: "Question not found" });
    }
    const updatedQuestion = await Question.findByIdAndUpdate(
        questionId,
        { $push: { answers: { username: user, response: option } } },
        { new: true, runValidators: true }
    );
    return NextResponse.json({ message: "Vote submitted" });
}