import { isUserInGroup } from "@/lib/services/admin";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { ValidationError } from "@/lib/api/errorHandling";
import dbConnect from "@/db/dbConnect";

const client_id = process.env.SPOTIFY_CLIENT_ID!;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET!;

let accessToken: string | null = null;

const getAccessToken = async (): Promise<string | null> => {
    if (accessToken) return accessToken;

    const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            Authorization: `Basic ${Buffer.from(`${client_id}:${client_secret}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
    });

    if (!response.ok) {
        console.error("Failed to fetch access token:", response.statusText);
        throw new Error("Failed to fetch access token");
    }

    const data = await response.json();
    accessToken = data.access_token;

    // Token expires in 1 hour, clear it after expiration
    setTimeout(() => (accessToken = null), data.expires_in * 1000);

    return accessToken;
};

async function searchSpotify(query: string) {
    const token = await getAccessToken();
    if (!token) {
        console.error("Failed to get access token");
        throw new Error("Failed to get spotify access  token");
    }
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

export const GET = withAuthAndErrors(
    async (
        req: NextRequest,
        {
            params,
            userId,
        }: AuthedContext<{
            params: { groupId: string };
        }>
    ) => {
        const { groupId } = params;
        const { searchParams } = new URL(req.url);
        const query = searchParams.get("q");

        if (!query) {
            throw new ValidationError("Missing query parameter");
        }

        await dbConnect();
        await isUserInGroup(userId, groupId);
        const data = await searchSpotify(query);
        return NextResponse.json(data);
    }
);
