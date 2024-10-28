"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Loader from "@/components/ui/Loader";
import Header from "@/components/ui/Header";
import { useParams } from "next/navigation";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { ArrowDown, ArrowUp } from 'lucide-react';


const QuestionHistoryPage = () => {
  const { user } = useAuthRedirect();
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [showGoTop, setShowGoTop] = useState(false); // Track if near top
  const [showGoBottom, setShowGoBottom] = useState(true); // Track if near bottom
  const { groupId } = useParams<{ groupId: string }>();

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/groups/${groupId}/question/history?limit=50&offset=${offset}`);
    const data = await res.json();
    setQuestions((prevQuestions) => {
      const combinedQuestions = [...prevQuestions, ...data.questions];
      const uniqueQuestions = Array.from(new Map(combinedQuestions.map(q => [q._id, q])).values());
      return uniqueQuestions;
    });
    setHasMore(data.questions.length > 0);
    setLoading(false);
  }, [groupId, offset]);

  useEffect(() => {
    if (user) {
      fetchQuestions();
    }
  }, [user, fetchQuestions]);

  const handleLoadMore = () => {
    setOffset((prevOffset) => prevOffset + 50);
  };

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

  if (loading) return <Loader loading={true} />;

  return (
    <>
      <Header href={`/groups/${groupId}/dashboard`} title="Question History" />
      <div className="pb-6">
        {questions &&
          questions.map((question) => (
            <Card key={question._id} className="mb-4">
              <CardHeader>
                <CardTitle>{question.question}</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/groups/${groupId}/question/${question._id}/results`}
                >
                  <Button>View Results</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        {hasMore && (
          <div className="flex justify-center mt-4 mb-6">
            <Button variant="secondary" onClick={handleLoadMore}>
              {loading ?  <Loader loading={true}/> : <div>Load More</div>}
            </Button>
          </div>
        )}
      </div>

      {showGoTop && (
        <Button
          variant="secondary"
          className="fixed bottom-20 right-6 w-10 h-10 p-0 " 
          onClick={scrollToTop}
        >
          <ArrowUp size={24} /> 
        </Button>
      )}
      {showGoBottom && (
        <Button
          variant="secondary"
          className="fixed bottom-5 right-6 w-10 h-10 p-0" 
          onClick={scrollToBottom}
        >
          <ArrowDown size={24} /> 
        </Button>
      )}
    </>
  );
};

export default QuestionHistoryPage;
