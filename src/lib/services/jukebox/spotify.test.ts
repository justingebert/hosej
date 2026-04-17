import { describe, it, expect, vi, beforeEach } from "vitest";

import { getSpotifyAccessToken, searchSpotifyTracks, _resetTokenCache } from "./spotify";
import { ValidationError } from "@/lib/api/errorHandling";

const mockFetch = vi.fn();

beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal("fetch", mockFetch);
    _resetTokenCache();
});

describe("getSpotifyAccessToken", () => {
    it("fetches and returns an access token", async () => {
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

    it("returns cached token on second call", async () => {
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

    it("throws when Spotify API returns error", async () => {
        mockFetch.mockResolvedValueOnce({ ok: false, statusText: "Unauthorized" });

        await expect(getSpotifyAccessToken()).rejects.toThrow(
            "Failed to fetch Spotify access token"
        );
    });
});

describe("searchSpotifyTracks", () => {
    it("throws ValidationError for empty query", async () => {
        await expect(searchSpotifyTracks("")).rejects.toThrow(ValidationError);
    });

    it("searches Spotify and returns results", async () => {
        const mockResults = { tracks: { items: [{ id: "1", name: "Test" }] } };

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ access_token: "search-token", expires_in: 3600 }),
        });
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

    it("throws when Spotify search fails", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ access_token: "fail-token", expires_in: 3600 }),
        });
        mockFetch.mockResolvedValueOnce({ ok: false, statusText: "Bad Request" });

        await expect(searchSpotifyTracks("test")).rejects.toThrow("Failed to fetch Spotify data");
    });
});
