import Rally from "@/db/models/rally";
import dbConnect from "@/lib/dbConnect";
import user from "@/db/models/user";

const POINTS = 2

//create submission 
export async function POST(request: Request) {
  try {
    const { rallyId, userId, imageUrl } = await request.json();
    await dbConnect();

    const sendUser = await user.findOne({ username: userId });

    const newSubmission = {
      userId: sendUser._id,
      username: sendUser.username,
      imageUrl: imageUrl,
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

    sendUser.points.push(sendUser.points[sendUser.points.length - 1] + POINTS);
    sendUser.save();

    return Response.json({
      message: "Picture submission added successfully",
      updatedRally,
    });
  } catch (error) {
    console.error("Error adding picture submission:", error);
    return Response.json({ message: error });
  }
}
