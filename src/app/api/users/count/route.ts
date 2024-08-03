import { NextResponse } from 'next/server'
import dbConnect from "@/lib/dbConnect";
import user from "@/db/models/user";

export const revalidate = 0

//get user count
export async function GET(req: Request, res: NextResponse) {
  await dbConnect();
  const count = await user.countDocuments({});
  return NextResponse.json(count);
}

