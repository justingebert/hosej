import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/db/dbConnect", () => ({ default: vi.fn() }));

import { getSpotifyAccessToken, searchSpotifyTracks, _resetTokenCache } from "./spotify";
import { ValidationError } from "@/lib/api/errorHandling";

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
    vi.clearAllMocks();
    _resetTokenCache();
});

describe("getSpotifyAccessToken", () => {
    it("should fetch and return an access token", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ access_token: "test-token", expires_in: 3600 }),
        });

        const token = await getSpotifyAccessToken();

        expect(token).toBe("test-token");
        expect(mockFetch).toHaveBeenCalledWith(
            "https://accounts.spotify.com/api/token",
            expect.objectContaining({ method: "POST" })
        );
    });

    it("should return cached token on second call", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ access_token: "cached-token", expires_in: 3600 }),
        });

        const token1 = await getSpotifyAccessToken();
        const token2 = await getSpotifyAccessToken();

        expect(token1).toBe("cached-token");
        expect(token2).toBe("cached-token");
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should throw when Spotify API returns error", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            statusText: "Unauthorized",
        });

        await expect(getSpotifyAccessToken()).rejects.toThrow(
            "Failed to fetch Spotify access token"
        );
    });
});

describe("searchSpotifyTracks", () => {
    it("should throw ValidationError for empty query", async () => {
        await expect(searchSpotifyTracks("")).rejects.toThrow(ValidationError);
    });

    it("should search Spotify and return results", async () => {
        const mockResults = { tracks: { items: [{ id: "1", name: "Test" }] } };

        // Token fetch
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ access_token: "search-token", expires_in: 3600 }),
        });
        // Search fetch
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockResults),
        });

        const result = await searchSpotifyTracks("test query");

        expect(result).toEqual(mockResults);
        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(mockFetch).toHaveBeenLastCalledWith(
            expect.stringContaining("test%20query"),
            expect.objectContaining({
                headers: { Authorization: "Bearer search-token" },
            })
        );
    });

    it("should throw when Spotify search fails", async () => {
        // Token fetch
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ access_token: "fail-token", expires_in: 3600 }),
        });
        // Search fetch fails
        mockFetch.mockResolvedValueOnce({
            ok: false,
            statusText: "Bad Request",
        });

        await expect(searchSpotifyTracks("test")).rejects.toThrow("Failed to fetch Spotify data");
    });
});
