import { NextRequest, NextResponse } from 'next/server'
import dbConnect from "@/lib/dbConnect";
import User from '@/db/models/user';

export const revalidate = 0
//get user by id
export async function GET(req: NextRequest,  { params }: { params: { userId: string } }){
    const userId = req.headers.get('x-user-id');
    try{
        await dbConnect();
        const user = await User.findById(userId).populate('groups');
        return NextResponse.json({groups: user.groups}, {status: 200});
    }catch (error) {
        console.log(`Error getting groups for user: ${userId}`, error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}