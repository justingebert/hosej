import useSWR from "swr";
import fetcher from "@/lib/fetcher";

export function useGroupsActivity(enabled: boolean = true) {
    const { data, error, isLoading, mutate } = useSWR<Record<string, boolean>>(
        enabled ? "/api/activity/groups" : null,
        fetcher
    );

    return { activity: data ?? {}, isLoading, error, mutate };
}
