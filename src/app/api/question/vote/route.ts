import mongoose from "mongoose";
import dbConnect from "@/db/dbConnect";
import Question from "@/db/models/Question";
import { NextResponse } from 'next/server'
import user from "@/db/models/user";
import { use } from "react";

export const revalidate = 0

export async function POST(req: Request){
    const data = await req.json();
    const { questionId, response, userThatVoted } = data;
    
    await dbConnect();
    const question = await Question.findById(questionId);
    if (!question) {
        
        return NextResponse.json({ message: "Question not found" });
    }

    const votingUser = await user.findOne({ username: userThatVoted });

    const hasVoted = question.answers.some((answer:any)=> answer.username.equals(votingUser._id));

    if (hasVoted) {
        return NextResponse.json({ message: "You have already voted" });
    }
    const updatedQuestion = await Question.findByIdAndUpdate(
        questionId,
        { $push: { answers: { username: votingUser._id, response: response } } },
        { new: true, runValidators: true }
    );
    return NextResponse.json({ message: "Vote submitted" });
}