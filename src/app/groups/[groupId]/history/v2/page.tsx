"use client";

import React from "react";
import { usePaginatedData } from "@/hooks/usePaginatedData";
import { columns } from "../columns";
import { useParams } from "next/navigation";
import { DataTable } from "../data-table";
import Header from "@/components/ui/Header";

export default function HistoryPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { data, loading, hasMore, loadMore } = usePaginatedData({ groupId });

  return (
    <>
      <Header href={`/groups/${groupId}/dashboard`} title="Question History" />
      <DataTable
        columns={columns}
        data={data}
        hasMore={hasMore}
        loading={loading}
        onLoadMore={loadMore}
      />
    </>
  );
}
