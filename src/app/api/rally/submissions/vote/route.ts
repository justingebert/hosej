import mongoose from "mongoose";
import dbConnect from "@/db/dbConnect";
import Rally from "@/db/models/rally";
import { NextResponse } from 'next/server'

export async function POST(req: Request){
    try{
        await dbConnect();
        const { rallyId, submissionId, userThatVoted } = await req.json()

        const rally = await Rally.findById(rallyId);
        if (!rally) {
            return NextResponse.json({ message: 'Rally not found' });
        }
        const submission = rally.submissions.id(submissionId);
        if (!submission) {
            return NextResponse.json({ message: 'Submission not found' });
        }
        const user = submission.votes.find((vote) => vote.username === userThatVoted);
        if (user) {
            return NextResponse.json({ message: 'User already voted' });
        }
        submission.votes.push({ username: userThatVoted });
        
        await rally.save();

        console.log(rally)
       
        return NextResponse.json("Vote added successfully")
    }catch (error) {
        console.error(error)
        return NextResponse.json({ message: error });
    }
}