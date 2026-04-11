import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import type { RallyDTO } from "@/types/models/rally";

export function useGroupRallies(groupId: string | null | undefined) {
    const key = groupId ? `/api/groups/${groupId}/rally` : null;
    const { data, error, isLoading, mutate } = useSWR<{ rallies: RallyDTO[] }>(key, fetcher);

    const createRally = async (payload: { task: string; lengthInDays: number }) => {
        if (!groupId) throw new Error("groupId is required");
        const res = await fetch(`/api/groups/${groupId}/rally`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const info = await res.json().catch(() => ({}));
            throw new Error(info.message || "Failed to create rally");
        }
        await mutate();
    };

    const activateRally = async () => {
        if (!groupId) throw new Error("groupId is required");
        const res = await fetch(`/api/groups/${groupId}/rally/activate`, { method: "POST" });
        if (!res.ok) {
            const info = await res.json().catch(() => ({}));
            throw new Error(info.message || "Failed to activate rally");
        }
        await mutate();
    };

    return {
        rallies: data?.rallies ?? [],
        isLoading,
        error,
        mutate,
        createRally,
        activateRally,
    };
}
