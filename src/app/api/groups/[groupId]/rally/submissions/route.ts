import Rally from "@/db/models/rally";
import dbConnect from "@/lib/dbConnect";
import User from "@/db/models/user";

const POINTS = 2

//create submission 
export async function POST(request: Request, { params }: { params: { groupId: string } }) {
  try {
    const { rallyId, userId, imageUrl } = await request.json();
    const { groupId } = params;
    await dbConnect();


    const sendUser = await User.findOne({ username: userId });

    const newSubmission = {
      userId: sendUser._id,
      username: sendUser.username,
      imageUrl: imageUrl,
      time: Date.now(),
    };
    ``;
    const updatedRally = await Rally.findByIdAndUpdate(
      rallyId,
      { $push: { submissions: newSubmission } },
      { new: true, runValidators: true }
    );

    if (!updatedRally) {
      return Response.json({ message: "Rally not found" });
    }

    await sendUser.addPoints(groupId, POINTS);

    return Response.json({
      message: "Picture submission added successfully",
      updatedRally,
    });
  } catch (error) {
    console.error("Error adding picture submission:", error);
    return Response.json({ message: error });
  }
}
