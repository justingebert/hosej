import { NextRequest, NextResponse } from 'next/server'
import dbConnect from "@/lib/dbConnect";
import User from "@/db/models/user";

export const revalidate = 0

//get user by id
export async function GET(req: NextRequest,  { params }: { params: { userId: string } }){
    const userId = params.userId;
    try{
        await dbConnect();
        const ret = await User.findById({userId});
        return NextResponse.json({user: ret}, {status: 200});
    }
    catch (error) {
        console.log(`Error getting user: ${userId}`, error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}