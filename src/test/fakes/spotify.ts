import { ValidationError } from "@/lib/api/errorHandling";

type SearchResponse = unknown;

let searchResponse: SearchResponse = { tracks: { items: [] } };
const calls: string[] = [];

export async function getSpotifyAccessToken(): Promise<string> {
    return "fake-token";
}

export async function searchSpotifyTracks(query: string): Promise<SearchResponse> {
    if (!query) throw new ValidationError("Missing query parameter");
    calls.push(query);
    return searchResponse;
}

export function setSpotifySearchResponse(response: SearchResponse) {
    searchResponse = response;
}

export function getSpotifyCalls(): ReadonlyArray<string> {
    return calls;
}

export function resetSpotifyFake() {
    searchResponse = { tracks: { items: [] } };
    calls.length = 0;
}

export function _resetTokenCache() {
    /* no-op in fake */
}
