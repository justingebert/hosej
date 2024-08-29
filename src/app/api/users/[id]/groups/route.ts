import { NextRequest, NextResponse } from 'next/server'
import dbConnect from "@/lib/dbConnect";
import Group from '@/db/models/Group';

export const revalidate = 0

//get user by id
export async function GET(req: NextRequest,  { params }: { params: { userId: string } }){
    const userId = params.userId;
    try{
        await dbConnect();
        const groups = await Group.find({members: userId});
        return NextResponse.json({groups});
    }
    catch (error) {
        console.log(error);
        return NextResponse.json({ message: error });
    }
}