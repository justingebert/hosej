import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import type { PictureSubmissionWithUrlDTO } from "@/types/models/rally";

export function useRallySubmissions(
    groupId: string | null | undefined,
    rallyId: string | null | undefined
) {
    const key = groupId && rallyId ? `/api/groups/${groupId}/rally/${rallyId}/submissions` : null;
    const { data, error, isLoading, mutate } = useSWR<{
        submissions: PictureSubmissionWithUrlDTO[];
    }>(key, fetcher);

    const submitPhoto = async (imageKey: string) => {
        if (!groupId || !rallyId) throw new Error("groupId and rallyId are required");
        const res = await fetch(`/api/groups/${groupId}/rally/${rallyId}/submissions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageKey }),
        });
        if (!res.ok) {
            const info = await res.json().catch(() => ({}));
            throw new Error(info.message || "Failed to submit photo");
        }
        await mutate();
    };

    const voteSubmission = async (submissionId: string) => {
        if (!groupId || !rallyId) throw new Error("groupId and rallyId are required");
        const res = await fetch(
            `/api/groups/${groupId}/rally/${rallyId}/submissions/${submissionId}/vote`,
            { method: "POST", headers: { "Content-Type": "application/json" } }
        );
        if (!res.ok) {
            const info = await res.json().catch(() => ({}));
            throw new Error(info.message || "Failed to vote on submission");
        }
        await mutate();
    };

    return {
        submissions: data?.submissions ?? [],
        isLoading,
        error,
        mutate,
        submitPhoto,
        voteSubmission,
    };
}
