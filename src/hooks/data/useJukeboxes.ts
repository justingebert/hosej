import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import type { IJukeboxProcessed } from "@/types/models/jukebox";

export type JukeboxSongPayload = {
    spotifyTrackId: string;
    title: string;
    artist: string;
    album: string;
    coverImageUrl: string;
};

export function useJukeboxes(groupId: string | null | undefined) {
    const key = groupId ? `/api/groups/${groupId}/jukebox?isActive=true` : null;
    const { data, error, isLoading, mutate } = useSWR<IJukeboxProcessed[]>(key, fetcher);

    const addSong = async (jukeboxId: string, track: JukeboxSongPayload) => {
        if (!groupId) throw new Error("groupId is required");
        const res = await fetch(`/api/groups/${groupId}/jukebox/${jukeboxId}/song`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(track),
        });
        if (!res.ok) {
            const info = await res.json().catch(() => ({}));
            throw new Error(info.message || "Failed to submit song");
        }
        await mutate();
    };

    const rateSong = async (jukeboxId: string, songId: string, rating: number) => {
        if (!groupId) throw new Error("groupId is required");
        const res = await fetch(`/api/groups/${groupId}/jukebox/${jukeboxId}/song/${songId}/rate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rating }),
        });
        if (!res.ok) {
            const info = await res.json().catch(() => ({}));
            throw new Error(info.message || "Failed to rate song");
        }
        await mutate();
    };

    return {
        jukeboxes: data ?? [],
        isLoading,
        error,
        mutate,
        addSong,
        rateSong,
    };
}
