import { useCallback, useState } from "react";

export type SpotifyArtist = { name: string };
export type SpotifyAlbum = { name: string; images: { url: string }[] };
export type SpotifyTrack = {
    id: string;
    name: string;
    artists: SpotifyArtist[];
    album: SpotifyAlbum;
};

export function useJukeboxSearch(groupId: string | null | undefined) {
    const [results, setResults] = useState<SpotifyTrack[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const search = useCallback(
        async (query: string) => {
            if (!groupId) throw new Error("groupId is required");
            if (!query.trim()) return;
            setIsLoading(true);
            setError(null);
            try {
                const res = await fetch(
                    `/api/groups/${groupId}/jukebox/search?q=${encodeURIComponent(query)}`
                );
                if (!res.ok) {
                    const info = await res.json().catch(() => ({}));
                    throw new Error(info.message || "Failed to fetch search results");
                }
                const json = await res.json();
                setResults((json.tracks?.items ?? []) as SpotifyTrack[]);
            } catch (err) {
                setError(err instanceof Error ? err : new Error("Search failed"));
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        },
        [groupId]
    );

    const reset = useCallback(() => {
        setResults(null);
        setError(null);
    }, []);

    return { results, isLoading, error, search, reset };
}
