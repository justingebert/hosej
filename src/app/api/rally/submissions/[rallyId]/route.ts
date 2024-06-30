import dbConnect from "@/db/dbConnect";
import Rally from "@/db/models/rally";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from 'next/server'


const s3 = new S3Client({
    region: process.env.AWS_REGION,
  });

//TODO questions left parameters
export const revalidate = 0

export async function GET(req: Request, { params }: { params: { rallyId: string } }){
    await dbConnect();
    const rallyId = params.rallyId;
    try{
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
                });

                let url;
                try {
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

        return NextResponse.json({ submissions });
    }
    catch (error) {
        return NextResponse.json({ message: error });
    }
}