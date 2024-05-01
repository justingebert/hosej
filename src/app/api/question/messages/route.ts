

import mongoose from "mongoose";
import dbConnect from "@/db/dbConnect";
import ChatMessage from "@/db/models/chatmessage";
import { NextResponse, type NextRequest } from 'next/server'
import user from "@/db/models/user";
import { send } from "process";

export const revalidate = 0

export async function POST(req: NextRequest){
    await dbConnect();

    const data = await req.json();
    const { questionId, username, message} = data;
    try{
        const sendingUser = await user.findOne({username: username});
        const newMessage = new ChatMessage({ question: questionId, user: sendingUser, message });
        await newMessage.save();
        const sendMessage = await newMessage.populate('user', 'username').execPopulate();

        return NextResponse.json({ message: sendMessage});
    }
    catch (error) {
        console.log(error);
        return NextResponse.json({ message: error });
    }
}
