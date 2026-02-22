import dbConnect from "@/db/dbConnect";
import Rally from "@/db/models/Rally";
import User from "@/db/models/User";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import Group from "@/db/models/Group";
import { isUserInGroup } from "@/lib/services/group";
import { SUBMITTED_RALLY_POINTS } from "@/config/POINT_CONFIG";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { NotFoundError, ValidationError } from "@/lib/api/errorHandling";

const s3 = new S3Client({
    region: process.env.AWS_REGION,
});

export const revalidate = 0;

//get submissions for a rally
export const GET = withAuthAndErrors(
    async (
        req: NextRequest,
        {
            params,
            userId,
        }: AuthedContext<{
            params: { groupId: string; rallyId: string };
        }>
    ) => {
        const { groupId, rallyId } = params;

        await dbConnect();
        await isUserInGroup(userId, groupId);

        const rally = await Rally.findById(rallyId);
        if (!rally) {
            throw new NotFoundError("Rally not found");
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
                    url = await getSignedUrl(s3, command, { expiresIn: 300 });
                } catch (s3Error: any) {
                    console.error(
                        `Failed to generate pre-signed URL for ${submission.imageUrl}`,
                        s3Error
                    );
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
);

//create submission
export const POST = withAuthAndErrors(
    async (
        req: NextRequest,
        {
            params,
            userId,
        }: AuthedContext<{
            params: { groupId: string; rallyId: string };
        }>
    ) => {
        const { groupId, rallyId } = params;

        await dbConnect();
        await isUserInGroup(userId, groupId);

        const { imageUrl } = await req.json();
        if (!imageUrl) {
            throw new ValidationError("imageUrl is required");
        }

        const group = await Group.findById(groupId);
        const sendUser = await User.findById(userId);
        if (!group || !sendUser) throw new NotFoundError("Group or user not found");

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
            throw new NotFoundError("Rally not found");
        }

        await group.addPoints(sendUser._id.toString(), SUBMITTED_RALLY_POINTS);

        return NextResponse.json({
            message: "Picture submission added successfully",
            updatedRally,
        });
    }
);
