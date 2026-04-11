import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import type { MissedActivitySummary } from "@/types/models/activityEvent";

export function useMissedActivity(groupId: string | null | undefined) {
    const key = groupId ? `/api/groups/${groupId}/activity/missed` : null;
    const { data, error, isLoading, mutate } = useSWR<MissedActivitySummary>(key, fetcher);

    return { missed: data, isLoading, error, mutate };
}
