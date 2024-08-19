import { NextRequest, NextResponse } from 'next/server'
import dbConnect from "@/lib/dbConnect";
import user from "@/db/models/user";

export const revalidate = 0

//get user by id
export async function GET(req: NextRequest,  { params }: { params: { userId: string } }){
    const userId = params.userId;
    try{
        await dbConnect();
        const ret = await user.findById({userId});
        return NextResponse.json({user: ret});
    }
    catch (error) {
        console.log(error);
        return NextResponse.json({ message: error });
    }
}