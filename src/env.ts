/**
 * Server-side environment variable validation.
 *
 * Import this module early (e.g. in API route wrappers or dbConnect)
 * so missing vars are caught at startup rather than at runtime.
 */

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

/** Validated server env — import and use instead of raw process.env */
export const env = {
    // Database
    MONGODB_URI: requireEnv("MONGODB_URI"),

    // Auth
    NEXTAUTH_SECRET: requireEnv("NEXTAUTH_SECRET"),
    AUTH_GOOGLE_ID: requireEnv("AUTH_GOOGLE_ID"),
    AUTH_GOOGLE_SECRET: requireEnv("AUTH_GOOGLE_SECRET"),

    // Firebase
    FIREBASE_SERVICE_ACCOUNT: requireEnv("FIREBASE_SERVICE_ACCOUNT"),

    // AWS
    AWS_REGION: requireEnv("AWS_REGION"),
    AWS_BUCKET_NAME: requireEnv("AWS_BUCKET_NAME"),

    // Spotify
    SPOTIFY_CLIENT_ID: requireEnv("SPOTIFY_CLIENT_ID"),
    SPOTIFY_CLIENT_SECRET: requireEnv("SPOTIFY_CLIENT_SECRET"),

    // Cron
    CRON_SECRET: requireEnv("CRON_SECRET"),
} as const;
