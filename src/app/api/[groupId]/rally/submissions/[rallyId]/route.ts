import dbConnect from "@/lib/dbConnect";
import Rally from "@/db/models/rally";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from 'next/server'

const s3 = new S3Client({
    region: process.env.AWS_REGION,
  });

export const revalidate = 0

//get submissions for a rally
export async function GET(req: Request, { params }: { params: { rallyId: string } }){
    const rallyId = params.rallyId;
    try{
        await dbConnect();
        const rally = await Rally.findById(rallyId);
        if (!rally) {
            return NextResponse.json({ message: "No active rally" , rally: null});
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
                    url = await getSignedUrl(s3, command, { expiresIn: 60 }); // URL expiration time in seconds
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
        return NextResponse.json({ message: error });
    }
}