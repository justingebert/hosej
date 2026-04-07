import useSWRInfinite from "swr/infinite";

import type { QuestionDTO } from "@/types/models/question";

interface UsePaginatedDataProps {
    groupId: string;
    limit?: number;
    search?: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function usePaginatedData({ groupId, limit = 25, search }: UsePaginatedDataProps) {
    const getKey = (pageIndex: number, previousPageData: { questions: QuestionDTO[] }) => {
        if (previousPageData && previousPageData.questions.length === 0) return null;

        const params = new URLSearchParams({
            limit: String(limit),
            offset: String(pageIndex * limit),
        });
        if (search) params.set("search", search);

        return `/api/groups/${groupId}/history?${params}`;
    };

    const { data, error, isLoading, size, setSize } = useSWRInfinite(getKey, fetcher);

    const questions = data ? data.flatMap((page) => page.questions) : [];
    const hasMore = data ? data[data.length - 1]?.questions.length > 0 : true;
    const loadMore = () => setSize(size + 1);

    return { data: questions, loading: isLoading, hasMore, loadMore, error };
}
