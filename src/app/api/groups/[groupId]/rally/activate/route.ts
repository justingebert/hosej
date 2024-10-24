import dbConnect from "@/lib/dbConnect";
import Rally from "@/db/models/rally";
import { NextRequest, NextResponse } from "next/server";
import Group from "@/db/models/Group";
import { isUserInGroup } from "@/lib/groupAuth";

export const revalidate = 0;

//get current rally and set state
export async function POST(req: NextRequest,{ params }: { params: { groupId: string } }) {
  const { groupId } = params;
  const userId = req.headers.get('x-user-id') as string;

  try {
    const authCheck = await isUserInGroup(userId, groupId);
    if (!authCheck.isAuthorized) {
      return NextResponse.json({ message: authCheck.message }, { status: authCheck.status });
    }

    await dbConnect();
    const group = await Group.findById(groupId);

    const activeRallies = await Rally.find({ groupId: groupId, active: true })
    if(activeRallies.length >= group.rallyCount){
        return NextResponse.json({ message: "rallies already active", rallies: activeRallies }, { status: 200 });
    }
    const countToActivate = group.rallyCount - activeRallies.length;


    const rallies = await Rally.find({ groupId: groupId, active: false, used: false }).limit(countToActivate);
    const currentTime = new Date();
    for(let rally of rallies){
        rally.active = true;
        rally.startTime = new Date(currentTime.getTime());
        rally.endTime = new Date(rally.startTime.getTime() + rally.lengthInDays * 24 * 60 * 60 * 1000);
        await rally.save();
    }

    return NextResponse.json({ message: "Activated rallies", rallies: rallies }, { status: 200 });
  }catch (error: any) {
    console.error(error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}