import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Group from '@/db/models/Group';


export async function GET(req: NextRequest) {

    const { user } = await req.json();

  await dbConnect();
  

  const groups = await Group.find({ members: user._id }).exec();
  return NextResponse.json(groups, { status: 200 });
}
