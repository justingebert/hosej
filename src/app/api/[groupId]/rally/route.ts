import dbConnect from "@/lib/dbConnect";
import Rally from "@/db/models/rally";
import { NextRequest, NextResponse } from "next/server";
import User from "@/db/models/user";
import { sendNotification } from "@/utils/sendNotification";
import Chat from "@/db/models/Chat";
import Group from "@/db/models/Group";

const POINTS = 3;

export const revalidate = 0;

//get current rally and set state
export async function GET(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    await dbConnect();
    const { groupId } = params;
    const group = await Group.findById(groupId);

    const currentTime = new Date();

    // Find all active rallies
    const rallies = await Rally.find({ groupId: groupId, active: true }).limit(group.rallyCount);

    if (rallies.length === 0) {
      return NextResponse.json({ message: "No active rallies", rallies: [] });
    }

    for (let rally of rallies) {
      const endTime = new Date(rally.endTime);
      const startTime = new Date(rally.startTime);
      
      if (rally.active && !rally.used && currentTime >= startTime && !rally.votingOpen && !rally.resultsShowing) {
        rally.used = true;
        await rally.save();

        await sendNotification('📷 New Rally Started! 📷', '📷 PARTICIPATE NOW! 📷');
      }

      // Voting phase: if current time is after the rally's endTime and voting is not yet open
      if (currentTime >= endTime && !rally.votingOpen && !rally.resultsShowing) {
        rally.votingOpen = true;
        rally.endTime = new Date(currentTime.getTime() + 24 * 60 * 60 * 1000); // 1 day for voting
        await rally.save();

        await sendNotification('📷 Rally Voting! 📷', '📷 VOTE NOW 📷');
      }

      // Results phase: if voting is over, but the rally is still active
      if (currentTime >= endTime && rally.votingOpen) {
        rally.votingOpen = false;
        rally.resultsShowing = true
        rally.endTime = new Date(currentTime.getTime() + 24 * 60 * 60 * 1000); // 1 day for results viewing
        await rally.save();
        await sendNotification('📷 Rally Results! 📷', '📷 VIEW NOW 📷');
      }

      if(currentTime >= endTime && rally.resultsShowing ) {
        rally.resultsShowing = false;
        rally.active = false;
        rally.used = true;
        // After results viewing day, set gap phase
        const gapEndTime = new Date(currentTime.getTime() + group.rallyGapDays * 24 * 60 * 60 * 1000);

        // Start a new rally after the gap phase
        const newRally = await Rally.findOne({
          groupId: groupId,
          active: false,
          used: false,
        });


        if (newRally) {
          newRally.active = true;
          newRally.startTime = gapEndTime; // New rally starts after the gap phase
          newRally.endTime = new Date(gapEndTime.getTime() + newRally.lengthInDays * 24 * 60 * 60 * 1000); // Set end time based on lengthInDays
          await newRally.save();
          await sendNotification('📷 Rally finished! 📷', `📷 Next Rally starting: ${newRally.startTime.toLocaleString()}📷`);
        }
      }
    }

    const activeRallies = rallies.filter(rally => currentTime >= new Date(rally.startTime));

    return NextResponse.json({ rallies: activeRallies });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

//create rally
export async function POST(req: Request) {
  try {
    await dbConnect();
    const { groupId, task, lengthInDays, submittedBy } = await req.json();

    //TODO this is different - garbage
    const newRally = new Rally({
      groupId,
      task,
      lengthInDays,
      submittedBy,
    });

    await newRally.save();

    // Create the associated chat
    const newChat = new Chat({
      group: groupId,
      entity: newRally._id,
      entityModel: "Rally", 
      messages: [], 
    });

    await newChat.save();

    // Update the question with the chatId
    newRally.chat = newChat._id;
    await newRally.save();

    const submittingUser = await User.findOne({ username: submittedBy });
    await submittingUser.addPoints(groupId, POINTS);

    return NextResponse.json({ message: "Rally created successfully" });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
