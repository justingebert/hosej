import { ValidationError } from "@/lib/api/errorHandling";

const client_id = process.env.SPOTIFY_CLIENT_ID!;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET!;

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

export async function getSpotifyAccessToken(): Promise<string> {
    if (cachedToken && Date.now() < tokenExpiresAt) {
        return cachedToken;
    }

    const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            Authorization: `Basic ${Buffer.from(`${client_id}:${client_secret}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
    });

    if (!response.ok) {
        console.error("Failed to fetch Spotify access token:", response.statusText);
        throw new Error("Failed to fetch Spotify access token");
    }

    const data = await response.json();
    cachedToken = data.access_token;
    // Expire 60s early to avoid edge cases
    tokenExpiresAt = Date.now() + data.expires_in * 1000 - 60_000;

    return cachedToken!;
}

export async function searchSpotifyTracks(query: string) {
    if (!query) {
        throw new ValidationError("Missing query parameter");
    }

    const token = await getSpotifyAccessToken();

    const response = await fetch(
        `https://api.spotify.com/v1/search?type=track&q=${encodeURIComponent(query)}`,
        {
            headers: { Authorization: `Bearer ${token}` },
        }
    );

    if (!response.ok) {
        console.error("Failed to fetch Spotify data:", response.statusText);
        throw new Error("Failed to fetch Spotify data");
    }

    return await response.json();
}

/** @internal Reset token cache — for testing only */
export function _resetTokenCache() {
    cachedToken = null;
    tokenExpiresAt = 0;
}
