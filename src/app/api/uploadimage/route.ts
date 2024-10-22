import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
import { S3Client } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from 'uuid'
import { NextRequest } from 'next/server'

// create a presigned URL for uploading images to S3
export async function POST(request: NextRequest) {
  try {
    const { filename, contentType, groupId, entity, entityId, userId } = await request.json()
    const client = new S3Client({ region: process.env.AWS_REGION })
    const { url, fields } = await createPresignedPost(client, {
      Bucket: process.env.AWS_BUCKET_NAME as string,
      Key:`${groupId}/${entity}/${entityId}/${uuidv4()}`,
      Conditions: [
        ['content-length-range', 0, 10485760], // up to 10 MBh
        ['eq', '$Content-Type', contentType],
        ['eq', '$x-amz-meta-userid', userId]
      ],
      Fields: {
        'Content-Type': contentType,
        'x-amz-meta-userid': userId
      },
      Expires: 600, // Seconds before the presigned post expires. 3600 by default.
    })

    return Response.json({ url, fields })
  } catch (error:any) {
    console.error('Error uploading image', error)
    return Response.json({ message: "Internal Server Error" }, { status: 500 })
  }
}
