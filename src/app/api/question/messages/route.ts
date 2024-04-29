

import mongoose from "mongoose";
import dbConnect from "@/db/dbConnect";
import ChatMessage from "@/db/models/chatmessage";
import { NextResponse, type NextRequest } from 'next/server'

export const revalidate = 0

export async function POST(req: NextRequest){
    await dbConnect();

    const data = await req.json();
    const { questionId, user, message} = data;
    
    try{
        const newMessage = new ChatMessage({ question: questionId, user: user, message });
        await newMessage.save();
        console.log(newMessage);
        return NextResponse.json({ message: newMessage.message, user: newMessage.user});
    }
    catch (error) {
        return NextResponse.json({ message: error });
    }
}
