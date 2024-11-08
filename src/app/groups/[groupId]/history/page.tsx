"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import Header from "@/components/ui/Header";
import { useParams } from "next/navigation";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { ArrowDown, ArrowUp } from 'lucide-react';
import { usePaginatedData } from "@/hooks/usePaginatedData";
import { DataTable } from "./data-table";
import { columns } from "./columns";


const QuestionHistoryPage = () => {
  const { user } = useAuthRedirect();
  const { groupId } = useParams<{ groupId: string }>();
  const { data, loading, hasMore, loadMore } = usePaginatedData({ groupId });
  const [showGoTop, setShowGoTop] = useState(false); // Track if near top
  const [showGoBottom, setShowGoBottom] = useState(true); // Track if near bottom

  const handleScroll = () => {
    const scrollTop = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    const scrolledToBottom = windowHeight + scrollTop >= documentHeight - 50; // Near bottom threshold
    const scrolledToTop = scrollTop <= 50; // Near top threshold

    setShowGoBottom(!scrolledToBottom);
    setShowGoTop(!scrolledToTop);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    
      {showGoTop && (
        <Button
          variant="secondary"
          className="fixed bottom-20 left-6 w-10 h-10 p-0 " 
          onClick={scrollToTop}
        >
          <ArrowUp size={24} /> 
        </Button>
      )}
      {showGoBottom && (
        <Button
          variant="secondary"
          className="fixed bottom-5 left-6 w-10 h-10 p-0" 
          onClick={scrollToBottom}
        >
          <ArrowDown size={24} /> 
        </Button>
      )}
    </>
  );
};

export default QuestionHistoryPage;
