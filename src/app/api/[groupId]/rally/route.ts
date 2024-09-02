import dbConnect from "@/lib/dbConnect";
import Rally from "@/db/models/rally";
import { NextRequest, NextResponse } from "next/server";
import User from "@/db/models/user";
import { sendNotification } from "@/utils/sendNotification";
import Chat from "@/db/models/Chat";

const MAX_RALLIES = 2;
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
    const currentTime = new Date();

    // Find all active rallies
    const rallies = await Rally.find({ groupId: groupId, active: true }).limit(
      MAX_RALLIES
    );

    if (rallies.length === 0) {
      return NextResponse.json({ message: "No active rallies", rallies: [] });
    }

    for (let rally of rallies) {
      if (currentTime >= new Date(rally.endTime) && !rally.votingOpen) {
        rally.votingOpen = true;
        rally.endTime = new Date(currentTime.getTime() + 24 * 60 * 60 * 1000); // Set end time for voting period
        await rally.save();

        await sendNotification('📷HoseJ Rally!!📷', '📷JETZT VOTEN DU FISCH📷');
      }

      if (rally.votingOpen && currentTime >= new Date(rally.endTime)) {
        rally.active = false;
        rally.used = true;
        rally.votingOpen = false;
        await rally.save();

        // Start a new rally
        const newRally = await Rally.findOne({
          groupId: groupId,
          active: false,
          used: false,
        });
        if (newRally) {
          newRally.active = true;
          newRally.startTime = currentTime;
          newRally.endTime = new Date(
            currentTime.getTime() + newRally.lengthInDays * 24 * 60 * 60 * 1000
          ); // Set end time based on lengthInDays
          await newRally.save();

          await sendNotification('📷HoseJ Rally!!📷', '📷NEUE RALLY HAT BEGONNEN DU FISCH📷');
        }
      }
    }

    return NextResponse.json({ rallies });
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
      entityModel: "Question", // Specify the entity model as 'Question'
      messages: [], // Initialize with no messages
    });

    await newChat.save();

    // Update the question with the chatId
    newRally.chat = newChat._id;
    await newRally.save();

    const submittingUser = await User.findOne({ username: submittedBy });
    await submittingUser.addPoints(POINTS);

    return NextResponse.json({ message: "Rally created successfully" });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
