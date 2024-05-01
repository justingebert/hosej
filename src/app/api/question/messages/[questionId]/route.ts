

import mongoose from "mongoose";
import dbConnect from "@/db/dbConnect";
import ChatMessage from "@/db/models/chatmessage";
import { NextResponse, type NextRequest } from 'next/server'
import user from "@/db/models/user";

export const revalidate = 0

export async function GET(req: NextRequest,  { params }: { params: { questionId: string } }){
    await dbConnect();
    const questionId = params.questionId;
    
    try{
        const Users = await user.find();
        const messages = await ChatMessage.find({ question: questionId }).populate('user', 'username').sort({ createdAt: 1 });;
        console.log("test");
        if(!messages){
            return NextResponse.json({ message: "No messages found" });
        }
        await console.log(messages);
        return NextResponse.json(messages);
    }
    catch (error) {
        console.log(error);
        return NextResponse.json({ message: error });
    }
}