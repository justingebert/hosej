import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import type { FeatureStatus } from "@/types/models/appConfig";

export type GlobalFeatureStatus = {
    questions: { status: FeatureStatus };
    rallies: { status: FeatureStatus };
    jukebox: { status: FeatureStatus };
};

export function useFeatureStatus() {
    const { data, error, isLoading, mutate } = useSWR<GlobalFeatureStatus>(
        "/api/features/status",
        fetcher
    );

    return { features: data, isLoading, error, mutate };
}
