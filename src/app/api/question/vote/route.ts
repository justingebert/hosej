import mongoose from "mongoose";
import dbConnect from "@/db/dbConnect";
import Question from "@/db/models/Question";
import { NextResponse } from 'next/server'
import user from "@/db/models/User";
import { use } from "react";

export const revalidate = 0

export async function POST(req: Request){
    const data = await req.json();
    const { questionId, option, userThatVoted } = data;
    console.log(data);
    await dbConnect();
    const question = await Question.findById(questionId);
    if (!question) {
        
        return NextResponse.json({ message: "Question not found" });
    }

    console.log(userThatVoted);
    const votingUser = await user.findOne({ username: userThatVoted });
    console.log(votingUser);

    const updatedQuestion = await Question.findByIdAndUpdate(
        questionId,
        { $push: { answers: { username: votingUser._id, response: option } } },
        { new: true, runValidators: true }
    );
    return NextResponse.json({ message: "Vote submitted" });
}