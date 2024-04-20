

import mongoose from "mongoose";
import dbConnect from "@/db/dbConnect";
import Question from "@/db/models/Question";
import user from "@/db/models/user";
import { NextResponse, type NextRequest } from 'next/server'

export const revalidate = 0

export async function GET(req: NextRequest){
    const searchParams = req.nextUrl.searchParams
    const questionId = searchParams.get('questionId') 
    await dbConnect();
    
    try{
        const question = await Question.findById(questionId);
        if (!question) {
            return NextResponse.json({ message: "Question not found" });
        }
        const voteCounts = question.answers.reduce((acc: any, answer:any) => {
            acc[answer.response] = (acc[answer.response] || 0) + 1;
            return acc;
        }, {});

        const totalUsers = await user.countDocuments();
        const totalVotes = question.answers.length;

        //vote count:
        //const results = Object.entries(voteCounts).map(([option, votes]) => ({ option, votes }));
        
        //percentage:
        const results = Object.entries(voteCounts).map(([option, votes]:[string,any]) => {
            const percentage = Math.round((votes / totalVotes) * 100);
            return { option, votes, percentage: percentage };
        });

        results.sort((a, b) => b.votes - a.votes);
        
        return Response.json({ results: results, totalVotes: totalVotes, totalUsers: totalUsers});
    }
    catch (error) {
        return NextResponse.json({ message: error });
    }
}