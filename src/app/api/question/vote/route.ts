import mongoose from "mongoose";
import dbConnect from "../../../../db/dbConnect";
import Question from "../../../../db/models/Question";
import { NextResponse } from 'next/server'
import User from "../../../../db/models/User";

export async function POST(req: Request){
    const data = await req.json();
    const { questionId, option, user } = data;
    await dbConnect();
    const question = await Question.findById(questionId);
    if (!question) {
        
        return NextResponse.json({ message: "Question not found" });
    }

    const votingUser = await User.findOne({ username: user });

    const updatedQuestion = await Question.findByIdAndUpdate(
        questionId,
        { $push: { answers: { username: votingUser._id, response: option } } },
        { new: true, runValidators: true }
    );
    return NextResponse.json({ message: "Vote submitted" });
}