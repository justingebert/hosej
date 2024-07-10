import { NextResponse } from 'next/server'
import dbConnect from "@/lib/dbConnect";
import user from "@/db/models/user";


export const revalidate = 0

export async function GET(req: Request, res: NextResponse) {
    await dbConnect();

    const users = await user.find({})

    return NextResponse.json({ users });
}

