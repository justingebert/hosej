import dbConnect from "@/lib/dbConnect";
import { NextRequest, NextResponse } from 'next/server'
import { isUserInGroup } from "@/lib/groupAuth";
import { SUBMITTED_RALLY_POINTS } from "@/db/POINT_CONFIG";
import { Group, Rally, User } from "@/db/models";

export const revalidate = 0

//create submission 
export async function POST(req: NextRequest, { params }: { params: { groupId: string, rallyId:string } }) {
  const { groupId, rallyId } = params;
  const userId = req.headers.get('x-user-id') as string;
 
  try {
    const authCheck = await isUserInGroup(userId, groupId);
    if (!authCheck.isAuthorized) {
      return NextResponse.json({ message: authCheck.message }, { status: authCheck.status });
    }
    const { imageUrl } = await req.json();

    await dbConnect();

    const group = await Group.findById(groupId);
    const sendUser = await User.findById(userId);

    const newSubmission = {
      userId: sendUser._id,
      username: sendUser.username,
      imageUrl: imageUrl,
      time: Date.now(),
    };

    const updatedRally = await Rally.findByIdAndUpdate(
      rallyId,
      { $push: { submissions: newSubmission } },
      { new: true, runValidators: true }
    );

    if (!updatedRally) {
      return Response.json({ message: "Rally not found" });
    }

    await group.addPoints(sendUser._id, SUBMITTED_RALLY_POINTS);

    return NextResponse.json({
      message: "Picture submission added successfully",
      updatedRally,
    });
  } catch (error) {
    console.error("Error adding picture submission:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

