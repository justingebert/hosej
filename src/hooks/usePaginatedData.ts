import useSWRInfinite from "swr/infinite";

import { QuestionDTO } from "@/types/models/question";

interface UsePaginatedDataProps {
  groupId: string;
  limit?: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function usePaginatedData({ groupId, limit = 1000 }: UsePaginatedDataProps) {
  // Define the SWR key generator for each page of data
  const getKey = (pageIndex: number, previousPageData: { questions: QuestionDTO[] }) => {
    // If no more data to fetch, return null to stop the pagination
    if (previousPageData && previousPageData.questions.length === 0) return null;

    // Otherwise, fetch the next page
    return `/api/groups/${groupId}/history?limit=${limit}&offset=${pageIndex * limit}`;
  };

  const { data, error, isLoading, size, setSize } = useSWRInfinite(getKey, fetcher);

  // Merge all pages of data into a single array
  const questions = data ? data.flatMap((page) => page.questions) : [];
  
  const hasMore = data ? data[data.length - 1]?.questions.length > 0 : true;

  const loadMore = () => setSize(size + 1);

  return { data: questions, loading: isLoading, hasMore, loadMore, error };
}
