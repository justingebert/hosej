import { PartialIQuestion } from "@/app/groups/[groupId]/(pages)/history/columns";
import { useState, useEffect, useCallback, useRef } from "react";

interface UsePaginatedDataProps {
  groupId: string;
  limit?: number;
}

export function usePaginatedData({ groupId, limit = 3000 }: UsePaginatedDataProps) {
  const [data, setData] = useState<PartialIQuestion[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const isFetching = useRef(false);

  const fetchData = useCallback(async (currentOffset: number) => {
    if (isFetching.current || !hasMore) return;

    isFetching.current = true;
    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/question/history?limit=${limit}&offset=${currentOffset}`);
      const result = await res.json();

      setData((prevData) => [...prevData, ...result.questions]);
      setHasMore(result.questions.length > 0); // If no results, disable further fetching
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [groupId, limit, hasMore]);

  useEffect(() => {
    fetchData(offset);
  }, [fetchData, offset]);

  const loadMore = () => {
    if (!isFetching.current && hasMore) {
      setOffset((prevOffset) => prevOffset + limit); // Update offset before fetching new data
    }
  };

  return { data, loading, hasMore, loadMore };
}