

import mongoose from "mongoose";
import dbConnect from "@/db/dbConnect";
import ChatMessage from "@/db/models/chatmessage";
import { NextResponse, type NextRequest } from 'next/server'

export const revalidate = 0

export async function GET(req: NextRequest,  { params }: { params: { questionId: string } }){
    await dbConnect();
    const questionId = params.questionId;
    try{
        const messages = await ChatMessage.find({ question: questionId }).populate('user', 'username').sort({ createdAt: 1 });;
        if(!messages){
            return NextResponse.json({ message: "No messages found" });
        }
        console.log(messages);
        return NextResponse.json(messages);
    }
    catch (error) {
        return NextResponse.json({ message: error });
    }
}