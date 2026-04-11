import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import type { GroupStatsDTO } from "@/types/models/group";

export function useGroupStats(groupId: string | null | undefined) {
    const { data, error, isLoading, mutate } = useSWR<GroupStatsDTO>(
        groupId ? `/api/groups/${groupId}/stats` : null,
        fetcher
    );

    return { stats: data, isLoading, error, mutate };
}
