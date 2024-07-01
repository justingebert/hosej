"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft } from 'lucide-react';
import { useUser } from "@/components/UserContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipLoader } from "react-spinners";

const QuestionHistoryPage = () => {
  const { username } = useUser();
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/question/history?limit=50&offset=${offset}`);
    const data = await res.json();
    setQuestions((prevQuestions) => {
      const combinedQuestions = [...prevQuestions, ...data.questions];
      // Deduplicate questions based on _id
      const uniqueQuestions = Array.from(new Map(combinedQuestions.map(q => [q._id, q])).values());
      return uniqueQuestions;
    });
    setHasMore(data.questions.length > 0);
    setLoading(false);
  }, [offset]);

  useEffect(() => {
    if (username) {
      fetchQuestions();
    }
  }, [username, fetchQuestions]);

  const handleLoadMore = () => {
    setOffset((prevOffset) => prevOffset + 50);
  };

  return (
    <div className="m-6 mb-1">
      <div className="flex items-center">
        <Link className="text-lg leading-none mr-auto cursor-pointer" href="/">
          <ArrowLeft />
        </Link>
      </div>
      <h1 className="text-xl font-bold text-center">Question History</h1>
      <div className="mt-5">
        {questions.length > 0 ? (
          questions.map((question) => (
            <Card key={question._id} className="mb-4">
              <CardHeader>
                <CardTitle>{question.question}</CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/dashboard/daily/results?questionid=${question._id}`}>
                  <Button>View Results</Button>
                </Link>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center">No questions found</div>
        )}
        {loading && (
          <div className="flex items-center justify-center">
            <ClipLoader size={50} color={"#FFFFFF"} loading={true} />
          </div>
        )}
        {!loading && hasMore && (
          <div className="flex justify-center mt-4 mb-4">
            <Button onClick={handleLoadMore}>Load More</Button>
          </div >
        )}
      </div>
    </div>
  );
};

export default QuestionHistoryPage;
