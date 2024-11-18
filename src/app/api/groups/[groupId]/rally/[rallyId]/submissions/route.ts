import dbConnect from "@/lib/dbConnect";
import Rally from "@/db/models/rally";
import User from "@/db/models/user";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest, NextResponse } from 'next/server'
import Group from "@/db/models/Group";
import { isUserInGroup } from "@/lib/groupAuth";
import { SUBMITTED_RALLY_POINTS } from "@/db/POINT_CONFIG";

const s3 = new S3Client({
    region: process.env.AWS_REGION,
  });

export const revalidate = 0

//get submissions for a rally
export async function GET(req: NextRequest, { params }: { params: { groupId:string , rallyId: string } }){
  const userId = req.headers.get('x-user-id') as string;  
  const { groupId, rallyId } = params;

    try{

        const authCheck = await isUserInGroup(userId, groupId);
        if (!authCheck.isAuthorized) {
          return NextResponse.json({ message: authCheck.message }, { status: authCheck.status });
        }

        await dbConnect();
        const rally = await Rally.findById(rallyId);
        if (!rally) {
            return NextResponse.json({ message: "Rally not found"}, { status: 404 });
        }
        
        const submissions = await Promise.all(
            rally.submissions.map(async (submission:any) => {
                
                const urlObject = new URL(submission.imageUrl);
                let s3Key = urlObject.pathname;
                if (s3Key.startsWith('/')) {
                    s3Key = s3Key.substring(2); // Remove leading '//'
                }

                const command = new GetObjectCommand({
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: s3Key, 
                    ResponseCacheControl: 'max-age=86400, public',
                });

                let url;
                try {
                    //@ts-ignore
                    url = await getSignedUrl(s3, command, { expiresIn: 300 }); // URL expiration time in seconds
                } catch (s3Error:any) {
                    console.error(`Failed to generate pre-signed URL for ${submission.imageUrl}`, s3Error);
                    throw new Error(`Failed to generate pre-signed URL: ${s3Error.message}`);
                }

                return {
                    ...submission.toObject(),
                    imageUrl: url,
                };
            })
        );

        submissions.sort((a, b) => b.votes.length - a.votes.length);

        return NextResponse.json({ submissions });
    }
    catch (error) {
        console.log(error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}


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
