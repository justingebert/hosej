

import mongoose from "mongoose";
import dbConnect from "../../../../db/dbConnect";
import Question from "../../../../db/models/Question";
import User from "../../../../db/models/User";
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(req: NextRequest){
    const searchParams = req.nextUrl.searchParams
    const questionId = searchParams.get('questionId') 
    await dbConnect();
    
    try{
        const question = await Question.findById(questionId);
        if (!question) {
            return NextResponse.json({ message: "Question not found" });
        }

        const voteCounts = question.answers.reduce((acc, answer) => {
            acc[answer.response] = (acc[answer.response] || 0) + 1;
            return acc;
        }, {});

        
        const results = Object.entries(voteCounts).map(([option, votes]) => ({ option, votes }));
        return Response.json({ results: results });
    }
    catch (error) {
        return NextResponse.json({ message: error });
    }
}