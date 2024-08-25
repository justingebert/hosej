import dbConnect from "@/lib/dbConnect";
import ChatMessage from "@/db/models/chatmessage";
import { NextResponse, type NextRequest } from 'next/server'
import User from "@/db/models/user";

export const revalidate = 0

//get messages for a question
export async function GET(req: NextRequest,  { params }: { params: { questionId: string } }){
    const questionId = params.questionId;
    try{
        await dbConnect();
        const Users = await User.find(); 
        //TODO only works if user is loaded idk why
        const messages = await ChatMessage.find({ question: questionId }).populate('user', 'username').sort({ createdAt: 1 });;
        if(!messages){
            return NextResponse.json({ message: "No messages found" });
        }
        return NextResponse.json(messages);
    }
    catch (error) {
        console.log(error);
        return NextResponse.json({ message: error });
    }
}