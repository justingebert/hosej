import dbConnect from "@/lib/dbConnect";
import Rally from "@/db/models/rally";
import User from "@/db/models/user";
import {GetObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import {NextRequest, NextResponse} from 'next/server'
import Group from "@/db/models/Group";
import {isUserInGroup} from "@/lib/groupAuth";
import {SUBMITTED_RALLY_POINTS} from "@/db/POINT_CONFIG";
import {AuthedContext, withAuthAndErrors} from "@/lib/api/withAuth";
import {ForbiddenError, NotFoundError, ValidationError} from "@/lib/api/errorHandling";

const s3 = new S3Client({
    region: process.env.AWS_REGION,
});

export const revalidate = 0

//get submissions for a rally
export const GET = withAuthAndErrors(async (req: NextRequest, {params, userId}: AuthedContext<{
    params: { groupId: string, rallyId: string }
}>) => {
    const {groupId, rallyId} = params;

    const authCheck = await isUserInGroup(userId, groupId);
    if (!authCheck.isAuthorized) {
        if (authCheck.status === 404) throw new NotFoundError(authCheck.message || 'Group not found');
        throw new ForbiddenError(authCheck.message || 'Forbidden');
    }

    await dbConnect();
    const rally = await Rally.findById(rallyId);
    if (!rally) {
        throw new NotFoundError("Rally not found");
    }

    const submissions = await Promise.all(
        rally.submissions.map(async (submission: any) => {

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
                url = await getSignedUrl(s3, command, {expiresIn: 300});
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

    submissions.sort((a, b) => b.votes.length - a.votes.length);

    return NextResponse.json({submissions});
});

//create submission 
export const POST = withAuthAndErrors(async (req: NextRequest, {params, userId}: AuthedContext<{
    params: { groupId: string, rallyId: string }
}>) => {
    const {groupId, rallyId} = params;

    const authCheck = await isUserInGroup(userId, groupId);
    if (!authCheck.isAuthorized) {
        if (authCheck.status === 404) throw new NotFoundError(authCheck.message || 'Group not found');
        throw new ForbiddenError(authCheck.message || 'Forbidden');
    }

    const {imageUrl} = await req.json();
    if (!imageUrl) {
        throw new ValidationError('imageUrl is required');
    }

    await dbConnect();

    const group = await Group.findById(groupId);
    const sendUser = await User.findById(userId);
    if (!group || !sendUser) throw new NotFoundError('Group or user not found');

    const newSubmission = {
        userId: sendUser._id,
        username: sendUser.username,
        imageUrl: imageUrl,
        time: Date.now(),
    };

    const updatedRally = await Rally.findByIdAndUpdate(
        rallyId,
        {$push: {submissions: newSubmission}},
        {new: true, runValidators: true}
    );

    if (!updatedRally) {
        throw new NotFoundError("Rally not found");
    }

    await group.addPoints(sendUser._id, SUBMITTED_RALLY_POINTS);

    return NextResponse.json({
        message: "Picture submission added successfully",
        updatedRally,
    });
});
