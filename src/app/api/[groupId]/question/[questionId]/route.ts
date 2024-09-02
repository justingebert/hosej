import dbConnect from "@/lib/dbConnect";
import Question from "@/db/models/Question";
import { NextResponse, type NextRequest } from 'next/server'
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

//export const revalidate = 0

const s3 = new S3Client({
    region: process.env.AWS_REGION,
});


//get question by id
export async function GET(req: NextRequest,  { params }: { params: { groupId: string, questionId: string } }){
    try{
        await dbConnect();
        const {questionId, groupId} = params
        
        let question = await Question.findOne({groupId: groupId, _id: questionId});

        if (question.image) {
            const urlObject = new URL(question.image);
            let s3Key = urlObject.pathname;
            if (s3Key.startsWith('/')) {
                s3Key = s3Key.substring(2); // Remove leading '//'
            }

            const command = new GetObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: s3Key,
                ResponseCacheControl: 'max-age=86400, public',
            });

            try {
                const url = await getSignedUrl(s3, command, { expiresIn: 60 }); // Short-lived URL
                question = {
                    ...question.toObject(),
                    imageUrl: url,
                };
            } catch (s3Error: any) {
                console.error(`Failed to generate pre-signed URL for ${question.imageUrl}`, s3Error);
                throw new Error(`Failed to generate pre-signed URL: ${s3Error.message}`);
            }
        }

        return NextResponse.json(question);
    }
    catch (error) {
        console.log(error);
        return NextResponse.json({ message: error });
    }
}