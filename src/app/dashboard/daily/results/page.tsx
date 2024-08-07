"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from 'next/navigation';
import { ClipLoader } from "react-spinners";
import VoteResults from "@/components/Question/VoteResults.client";
import BackLink from "@/components/ui/BackLink";
import Loader from "@/components/ui/Loader";

const ResultsPage = () => {
  const searchParams = useSearchParams();
  const questionId = searchParams.get('questionid');
  const [question, setQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestion = async () => {
      setLoading(true);
      const res = await fetch(`/api/question/${questionId}`);
      const data = await res.json();
      setQuestion(data.question);
      setLoading(false);
    };

    if (questionId) {
      fetchQuestion();
    }
  }, [questionId]);

  if (loading) return <Loader loading={true} />
  if (!question) return <p>No Question avaiable</p>

  return (
    <>
      <BackLink href={"/dashboard/history"} />
      {question && (
        <div>
          <h1 className="text-xl font-bold text-center mb-10 mt-10">
            {question.question}
          </h1>
          <div className="flex flex-col items-center mb-10">
            {question.questionType !== "text" &&
              question.options &&
              question.options.map((option: any, index: number) => (
                <div
                  key={index}
                  className="p-4 m-2 bg-primary text-primary-foreground rounded-lg w-full max-w-md "
                >
                  {option}
                </div>
              ))}
          </div>
          <VoteResults question={question} available={false} className="mt-2" />
        </div>
      )}
    </>
  );
};

const ResultsPageWrapper = () => (
  <Suspense fallback={<div className="flex items-center justify-center h-screen"><ClipLoader size={50} color={"#FFFFFF"} loading={true} /></div>}>
    <ResultsPage />
  </Suspense>
);

export default ResultsPageWrapper;
