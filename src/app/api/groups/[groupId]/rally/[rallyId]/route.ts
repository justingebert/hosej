import dbConnect from "@/lib/dbConnect";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { isUserInGroup } from "@/lib/groupAuth";
import { Rally } from "@/db/models";
import { withErrorHandling } from "@/lib/apiErrorHandling";

const s3 = new S3Client({
    region: process.env.AWS_REGION,
});

export const revalidate = 0;

async function getRallyHandler(req: Request, { params }: { params: { groupId: string; rallyId: string } }) {
    const userId = req.headers.get("x-user-id") as string;
    const { groupId, rallyId } = params;

    const authCheck = await isUserInGroup(userId, groupId);
    if (!authCheck.isAuthorized) {
        return Response.json({ message: authCheck.message }, { status: authCheck.status });
    }

    await dbConnect();
    const rally = await Rally.findById(rallyId);
    if (!rally) {
        return Response.json({ message: "Rally not found" }, { status: 404 });
    }

    const submissions = await Promise.all(
        rally.submissions.map(async (submission: any) => {
            const urlObject = new URL(submission.imageUrl);
            let s3Key = urlObject.pathname;
            if (s3Key.startsWith("/")) {
                s3Key = s3Key.substring(2); // Remove leading '//'
            }

            const command = new GetObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: s3Key,
                ResponseCacheControl: "max-age=86400, public",
            });

            let url;
            try {
                //@ts-ignore
                url = await getSignedUrl(s3, command, { expiresIn: 300 }); // URL expiration time in seconds
            } catch (s3Error: any) {
                console.error(`Failed to generate pre-signed URL for ${submission.imageUrl}`, s3Error);
                throw new Error(`Failed to generate pre-signed URL: ${s3Error.message}`);
            }

            return {
                ...submission.toObject(),
                imageUrl: url,
            };
        })
    );

    rally.submissions = submissions.sort((a, b) => b.votes.length - a.votes.length);

    return Response.json(rally);
}

export const GET = withErrorHandling(getRallyHandler);
