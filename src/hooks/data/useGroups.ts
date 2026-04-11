import useSWR, { mutate as globalMutate } from "swr";
import fetcher from "@/lib/fetcher";
import type { GroupDTO } from "@/types/models/group";

const KEY = "/api/groups";

export function useGroups(enabled: boolean = true) {
    const { data, error, isLoading, mutate } = useSWR<{ groups: GroupDTO[] }>(
        enabled ? KEY : null,
        fetcher
    );

    const createGroup = async (name: string) => {
        const res = await fetch(KEY, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
        });
        if (!res.ok) {
            const info = await res.json().catch(() => ({}));
            throw new Error(info.message || "Failed to create group");
        }
        const payload = (await res.json()) as { group: GroupDTO };
        await globalMutate(KEY);
        return payload;
    };

    const joinGroup = async (groupId: string) => {
        const res = await fetch(`/api/groups/${groupId}/members`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) {
            const info = await res.json().catch(() => ({}));
            throw new Error(info.message || "Failed to join group");
        }
        await globalMutate(KEY);
    };

    return {
        groups: data?.groups ?? [],
        isLoading,
        error,
        mutate,
        createGroup,
        joinGroup,
    };
}
