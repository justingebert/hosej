import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
import { S3Client } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from 'uuid'
import { NextRequest, NextResponse } from 'next/server'
import { AuthedContext, withAuthAndErrors } from '@/lib/api/withAuth'
import { ValidationError } from '@/lib/api/errorHandling'

// create a presigned URL for uploading images to S3
export const POST = withAuthAndErrors(async (request: NextRequest, {userId}: AuthedContext) => {
    const {filename, contentType, groupId, entity, entityId} = await request.json()

    if (!filename || !contentType || !groupId || !entity || !entityId) {
        throw new ValidationError('filename, contentType, groupId, entity, and entityId are required')
    }

    const client = new S3Client({region: process.env.AWS_REGION})
    const key = `${groupId}/${entity}/${entityId}/${uuidv4()}`
    const {url, fields} = await createPresignedPost(client, {
        Bucket: process.env.AWS_BUCKET_NAME as string,
        Key: key,
        Conditions: [
            ['content-length-range', 0, 10485760], // up to 10 MB
            ['eq', '$Content-Type', contentType],
            ['eq', '$x-amz-meta-userid', userId],
        ],
        Fields: {
            'Content-Type': contentType,
            'x-amz-meta-userid': userId,
        },
        Expires: 600, // Seconds before the presigned post expires.
    })

    return NextResponse.json({url, fields}, {status: 200})
})
