import mongoose from "mongoose";
import dbConnect from "@/db/dbConnect";
import Rally from "@/db/models/rally";
import { NextResponse } from 'next/server'

//TODO questions left parameters
export const revalidate = 0

export async function GET(req: Request){
    await dbConnect();
    try{
        const rally = await Rally.findOne({ active: true });
        if (!rally) {
            return NextResponse.json({ message: "No active rally" , rally: null});
        }

        return NextResponse.json({rally});
    }
    catch (error) {
        return NextResponse.json({ message: error });
    }
}