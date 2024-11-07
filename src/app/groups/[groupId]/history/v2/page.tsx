"use client";

import React from "react";
import { usePaginatedData } from "@/hooks/usePaginatedData";
import { columns } from "./columns";
import { useParams } from "next/navigation";
import { DataTable } from "./data-table";

export default function HistoryPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { data, loading, hasMore, loadMore } = usePaginatedData({ groupId });

  

  return (
    <div >
      <DataTable
        columns={columns}
        data={data}
        hasMore={hasMore}
        loading={loading}
        onLoadMore={loadMore}
      />
    </div>
  );
}
