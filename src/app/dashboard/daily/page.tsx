"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useUser } from "../../../context/UserContext";
import VoteOptions from "../../../components/Question/VotingOptions.client";
import VoteResults from "../../../components/Question/VoteResults.client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from 'lucide-react';
import {  ClipLoader } from "react-spinners";

function QuestionsTabs({ questions, userHasVoted, setUserHasVoted }: any) {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('returnTo') || (questions.length > 0 ? questions[0]._id : undefined);

  return (
    <Tabs defaultValue={defaultTab}>
      <div className="flex justify-center mt-5">
        <TabsList>
          {questions.map((question: any, index: number) => (
            <TabsTrigger key={question._id} value={question._id}>
              {"Daily " + (index + 1)}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {questions.map((question: any) => (
        <TabsContent key={question._id} value={question._id}>
          <h2 className="font-bold text-center mt-10">{question.question}</h2>
          <div className="mt-10">
            {userHasVoted[question._id] ? (
              <VoteResults question={question} />
            ) : (
              <VoteOptions
                question={question}
                onVote={() => setUserHasVoted({ ...userHasVoted, [question._id]: true })}
              />
            )}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}

const DailyQuestionPage = () => {
  const { username } = useUser();
  const [questions, setQuestions] = useState<any>([]);
  const [userHasVoted, setUserHasVoted] = useState<any>({});
  const [activeTab, setActiveTab] = useState<string | undefined>();
  const router = useRouter();

  useEffect(() => {
    const fetchQuestions = async () => {
      router.refresh();
      const res = await fetch(`/api/question/daily`, { cache: "no-store" });
      const data = await res.json();

      console.log(username);
      if (data.questions) {
        setQuestions(data.questions);
        const votes = data.questions.reduce((acc: any, question: any) => {
          acc[question._id] = question.answers.some(
            (answer: any) => answer.username.username === username
          );
          return acc;
        }, {});
        setUserHasVoted(votes);
      }
      if (data.message) {
        alert(data.message);//TODO improve
      }
    };

    if (username) {
      fetchQuestions();
    }
  }, [username]);

  return (
    <div className="m-6 mb-1">
      <div className="flex items-center">
        <Link className="text-lg leading-none mr-auto cursor-pointer" href="/">
          <ArrowLeft />
        </Link>
      </div>
      <h1 className="text-xl font-bold text-center">Daily Questions</h1>
      {questions.length > 0 ? (
        <Suspense fallback={
          <div className="flex items-center justify-center h-screen">
            <ClipLoader size={50} color={"FFFFFF"} loading={true} />
          </div>
        }>
          <QuestionsTabs
            questions={questions}
            userHasVoted={userHasVoted}
            setUserHasVoted={setUserHasVoted}
          />
        </Suspense>
      ) : (
        <div className="flex items-center justify-center ">
          <ClipLoader size={50} color={"FFFFFF"} loading={true}/>
        </div>
      )}
    </div>
  );
};

export default DailyQuestionPage;
