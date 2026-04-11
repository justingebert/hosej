import useSWR from "swr";
import fetcher from "@/lib/fetcher";

export interface AdminGroup {
    _id: string;
    name: string;
    memberCount: number;
}

export function useAdminGroups(enabled: boolean = true) {
    const { data, error, isLoading, mutate } = useSWR<AdminGroup[]>(
        enabled ? "/api/admin/groups" : null,
        fetcher,
        {
            onError: () => {},
            shouldRetryOnError: false,
        }
    );

    return { groups: data ?? [], isLoading, error, mutate };
}
