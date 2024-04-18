

import mongoose from "mongoose";
import dbConnect from "@/db/dbConnect";
import Question from "@/db/models/Question";
import user from "@/db/models/user";
import { NextResponse, type NextRequest } from 'next/server'

export const revalidate = 0

//TODO improve error handeling
export async function POST(req: NextRequest){
    await dbConnect();
    
    try{
        const data = await req.json();

        const question = new Question({category: data.category, questionType: data.questionType, question:data.question, options: data.options });
        await question.save();
        if(!question){
            return NextResponse.json({ message: "No question found" });
        }
        return Response.json({ message: "Created Question"});
    }
    catch (error) {
        return NextResponse.json({ message: error });
    }
}