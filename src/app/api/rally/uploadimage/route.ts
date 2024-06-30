import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
import { S3Client } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: Request) {
  const { filename, contentType, userid, rallyId } = await request.json()

  try {
    const client = new S3Client({ region: process.env.AWS_REGION })
    const { url, fields } = await createPresignedPost(client, {
      Bucket: process.env.AWS_BUCKET_NAME as string,
      Key:`${rallyId}/${uuidv4()}`,
      Conditions: [
        ['content-length-range', 0, 10485760], // up to 10 MB
        ['eq', '$Content-Type', contentType],
        ['eq', '$x-amz-meta-userid', userid]
      ],
      Fields: {
        'Content-Type': contentType,
        'x-amz-meta-userid': userid
      },
      Expires: 600, // Seconds before the presigned post expires. 3600 by default.
    })

    console.log({ url, fields })
    return Response.json({ url, fields })
  } catch (error:any) {
    console.error('Error creating presigned URL:', error)
    return Response.json({ error: error.message })
  }
}
