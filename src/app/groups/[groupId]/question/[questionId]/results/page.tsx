"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams } from 'next/navigation';
import { ClipLoader } from "react-spinners";
import VoteResults from "@/components/Question/VoteResults.client";
import BackLink from "@/components/ui/BackLink";
import Loader from "@/components/ui/Loader";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import Image from "next/image";

const ResultsPage = () => {
  const { session, status, user } = useAuthRedirect();
  const [question, setQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { groupId, questionId } = useParams<{ groupId: string, questionId: string }>();

  useEffect(() => {
    const fetchQuestion = async () => {
      setLoading(true);
      const res = await fetch(`/api/${groupId}/question/${questionId}`);
      const data = await res.json();
      setQuestion(data);
      setLoading(false);
    };

    if (questionId) {
      fetchQuestion();
    }
  }, [groupId, questionId]);

  if (loading) return <Loader loading={true} />;
  
  return (
    <>
      <BackLink href={`/groups/${groupId}/history`} />
      {question && (
        <div>
          <h1 className="text-xl font-bold text-center mb-10 mt-10">
            {question.question}
          </h1>
          {question.imageUrl &&
            <Image
              src={question.imageUrl}
              alt={`${question.question}`}
              className="object-cover w-full h-full cursor-pointer rounded-lg mt-4"
              width={300}
              height={300}
            />}
          <div className="flex flex-col items-center mb-10">
            {question.questionType.startsWith("image") &&
              question.options &&
              question.options.map((option: any, index: number) => (
                <div
                  key={index}
                  className="p-4 m-2 bg-primary text-primary-foreground rounded-lg w-full max-w-md"
                >
                  <Image
                    src={option}
                    alt={`Option ${index + 1}`}
                    className="object-cover w-full h-full rounded-lg"
                    width={300}
                    height={300}
                    priority={index === 0}
                  />
                </div>
              ))}
            {!question.questionType.startsWith("image") &&
              question.options &&
              question.options.map((option: any, index: number) => (
                <div
                  key={index}
                  className="p-4 m-2 bg-primary text-primary-foreground rounded-lg w-full max-w-md"
                >
                  {option}
                </div>
              ))}
          </div>
          <VoteResults user={user} question={question} available={false} returnTo={`question/${questionId}/results`}/>
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
