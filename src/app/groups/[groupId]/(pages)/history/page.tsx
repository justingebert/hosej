"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Header from "@/components/ui/custom/Header";
import { useParams } from "next/navigation";
import { ArrowDown, ArrowUp } from 'lucide-react';
import { usePaginatedData } from "@/hooks/usePaginatedData";
import { DataTable } from "./data-table";
import { columns } from "./columns";

const QuestionHistoryPage = () => {
  const params = useParams<{ groupId: string }>();
  const groupId = params? params.groupId : "";
  const { data, loading, hasMore, loadMore } = usePaginatedData({ groupId });
  const [showGoTop, setShowGoTop] = useState(false); 
  const [showGoBottom, setShowGoBottom] = useState(true); 

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
      <Header title="Question History" />
      <DataTable
        columns={columns}
        data={data}
        hasMore={hasMore}
        loading={loading}
        onLoadMore={loadMore}
      />
    
    <div className="fixed bottom-24 left-6 space-y-4 flex flex-col">
    {showGoTop && (
      <Button
        variant="secondary"
        className="w-10 h-10 p-0"
        onClick={scrollToTop}
      >
        <ArrowUp size={24} /> 
      </Button>
    )}
    {showGoBottom && (
      <Button
        variant="secondary"
        className="w-10 h-10 p-0"
        onClick={scrollToBottom}
      >
        <ArrowDown size={24} /> 
      </Button>
    )}
  </div>
    </>
  );
};

export default QuestionHistoryPage;
