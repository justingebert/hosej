"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Loader from "@/components/ui/Loader";
import Header from "@/components/ui/Header";
import { useParams } from "next/navigation";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";


//attach newly paged questions 
const QuestionHistoryPage = () => {
  const { session, status, user } = useAuthRedirect();
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { groupId } = useParams<{ groupId: string }>();

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/groups/${groupId}/question/history?limit=50&offset=${offset}`);
    const data = await res.json();
    setQuestions((prevQuestions) => {
      const combinedQuestions = [...prevQuestions, ...data.questions];
      // Deduplicate questions based on _id
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

  if (loading) return <Loader loading={true} />
  if (!questions) return <p>No Questions avaiable</p>

  return (
    <>
      <Header href={`/groups/${groupId}/dashboard`} title="Question Hisotry" />
      <div>
        {questions && questions.map((question) => (
            <Card key={question._id} className="mb-4">
              <CardHeader>
                <CardTitle>{question.question}</CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/groups/${groupId}/question/${question._id}/results`}>
                  <Button>View Results</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        {!loading && hasMore && (
          <div className="flex justify-center mt-4 mb-4">
            <Button variant="secondary" onClick={handleLoadMore}>Load More</Button>
          </div >
        )}
      </div>
    </>
  );
};

export default QuestionHistoryPage;
