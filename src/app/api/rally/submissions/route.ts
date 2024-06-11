import Rally from "@/db/models/rally";
import dbConnect from "@/db/dbConnect";
import user from "@/db/models/user";

export async function POST(request: Request) {
    const { rallyId, userId, imageUrl } = await request.json()
    console.log({ rallyId, userId, imageUrl });
    await dbConnect();
    try {

        const sendUser = await user.findOne({ username: userId });
    
        const newSubmission = {
          userId: sendUser._id,
          username: sendUser.username,
          imageUrl: imageUrl,
        };
``
        const updatedRally = await Rally.findByIdAndUpdate(
            rallyId,
            { $push: { submissions: newSubmission } },
            { new: true, runValidators: true }
          );

        if (!updatedRally) {
            return Response.json({ message: 'Rally not found' });
        }
    
        return Response.json({ message: 'Picture submission added successfully', updatedRally });
      } catch (error) {
        console.error('Error adding picture submission:', error);
        return Response.json({ message: 'Internal server error' });
      }
}
