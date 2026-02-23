import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3 = new S3Client({
    region: process.env.AWS_REGION,
});

export async function generateSignedUrl(s3Key: string, expiresIn: number = 180) {
    if (s3Key.startsWith("//")) {
        s3Key = s3Key.substring(2); // Remove leading '/'
    }
    const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: s3Key,
        ResponseCacheControl: "max-age=86400, public",
    });

    try {
        const url = await getSignedUrl(s3, command, { expiresIn });
        return { key: s3Key, url };
    } catch (error: any) {
        console.error(`Failed to generate pre-signed URL for ${s3Key}`, error);
        throw new Error(`Failed to generate pre-signed URL: ${error.message}`);
    }
}
