import { PartialIQuestion } from "@/app/groups/[groupId]/history/v2/columns";
import { useState, useEffect, useCallback } from "react";


interface UsePaginatedDataProps {
  groupId: string;
  limit?: number;
}

export function usePaginatedData({ groupId, limit = 50 }: UsePaginatedDataProps) {
  const [data, setData] = useState<PartialIQuestion[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/question/history?limit=${limit}&offset=${offset}`);
      const result = await res.json();
      setData((prevData) => [...prevData, ...result.questions]);
      setHasMore(result.questions.length > 0);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [groupId, limit, offset]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const loadMore = () => setOffset((prevOffset) => prevOffset + limit);

  return { data, loading, hasMore, loadMore };
}
