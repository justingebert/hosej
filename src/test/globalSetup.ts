import { MongoMemoryServer } from "mongodb-memory-server";

let mongod: MongoMemoryServer | undefined;

export async function setup() {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();

    process.env.NEXTAUTH_SECRET ??= "test-secret";
    process.env.AUTH_GOOGLE_ID ??= "test-google-id";
    process.env.AUTH_GOOGLE_SECRET ??= "test-google-secret";
    process.env.FIREBASE_SERVICE_ACCOUNT ??= JSON.stringify({ project_id: "test" });
    process.env.AWS_REGION ??= "eu-central-1";
    process.env.AWS_BUCKET_NAME ??= "test-bucket";
    process.env.SPOTIFY_CLIENT_ID ??= "test-spotify-id";
    process.env.SPOTIFY_CLIENT_SECRET ??= "test-spotify-secret";
    process.env.CRON_SECRET ??= "test-cron-secret";
}

export async function teardown() {
    await mongod?.stop();
}
