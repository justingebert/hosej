import {isUserInGroup} from "@/lib/groupAuth";
import {NextRequest, NextResponse} from "next/server";
import {AuthedContext, withAuthAndErrors} from "@/lib/api/withAuth";
import {ForbiddenError, NotFoundError, ValidationError} from "@/lib/api/errorHandling";

const client_id = process.env.SPOTIFY_CLIENT_ID!;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET!;

let accessToken: string | null = null;

const getAccessToken = async (): Promise<string | null> => {
    if (accessToken) return accessToken;

    const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            Authorization: `Basic ${Buffer.from(
                `${client_id}:${client_secret}`
            ).toString("base64")}`,
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

export const GET = withAuthAndErrors(async (req: NextRequest, {params, userId}: AuthedContext<{
    params: { groupId: string }
}>) => {
    const {groupId} = params;
    const {searchParams} = new URL(req.url);
    const query = searchParams.get("q");

    if (!query) {
        throw new ValidationError("Missing query parameter");
    }

    const authCheck = await isUserInGroup(userId, groupId);
    if (!authCheck.isAuthorized) {
        if (authCheck.status === 404) throw new NotFoundError(authCheck.message || 'Group not found');
        throw new ForbiddenError(authCheck.message || 'Forbidden');
    }

    const token = await getAccessToken();
    if (!token) {
        console.error("Failed to get access token");
        return NextResponse.json(
            {error: "Internal Server Error"},
            {status: 500}
        );
    }
    const response = await fetch(
        `https://api.spotify.com/v1/search?type=track&q=${encodeURIComponent(
            query
        )}`,
        {
            headers: {Authorization: `Bearer ${token}`},
        }
    );

    if (!response.ok) {
        console.error("Failed to fetch Spotify data:", response.statusText);
        return NextResponse.json(
            {error: "Failed to fetch Spotify data"},
            {status: response.status}
        );
    }

    const data = await response.json();
    return NextResponse.json(data);
});
