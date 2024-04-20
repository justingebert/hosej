"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "../../../context/UserContext";
import VoteOptions from "../../../components/VotingOptions.client";
import VoteResults from "../../../components/VoteResults.client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { unstable_noStore } from "next/cache";
import { useRouter } from "next/navigation";
import { useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DailyQuestionPage = () => {
  const { username } = useUser();
  const [questions, setQuestions] = useState<any>([]);
  const [userHasVoted, setUserHasVoted] = useState<any>({});
  const [activeTab, setActiveTab] = useState<string | undefined>();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    unstable_noStore();
    const fetchQuestions = async () => {
      router.refresh();
      const res = await fetch(`/api/question/daily`, { cache: "no-store" });
      const data = await res.json();

      console.log(data);
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
    };

    if (username) {
      fetchQuestions();
    }
  }, [username]);

  const getNewQuestions = async () => {
    const res = await fetch(`/api/question/daily/update`, {
      cache: "no-store",
    });
    const data = await res.json();

    if (data.message) {
      alert(data.message);
    }

    if (data.question) {
      setQuestions(data.question);
      console.log(data.question);
      const hasVoted = data.question.answers.some(
        (answer: any) => answer.username === username
      );
      setUserHasVoted(hasVoted);
    }
    router.refresh();
  };

  const defaultTab = searchParams.get('returnTo') || (questions.length > 0 ? questions[0]._id : undefined);

  return (
    <div className="m-6">
      <div className="flex items-center">
        <Link className="text-lg leading-none mr-auto cursor-pointer" href="/">
          ←
        </Link>
      </div>
      <h1 className="text-xl font-bold text-center">Daily Questions</h1>
        {questions.length > 0 ? (
          <Tabs defaultValue={defaultTab}>
            <div className="flex justify-center mt-5">
            <TabsList>
              {questions.map((question: any, index: number) => (
                <TabsTrigger key={question._id} value={question._id} >
                  {"Daily " + (index + 1)}
                </TabsTrigger>
              ))}
            </TabsList>
            </div>
            {questions.map((question: any) => (
              <TabsContent key={question._id} value={question._id}>
                <h2 className="font-bold text-center mt-10">
                  {question.question}
                </h2>
                <div className="mt-10">
                {userHasVoted[question._id as string] ? (
                  <VoteResults question={question} />
                ) : (
                  <VoteOptions
                    question={question}
                    onVote={() =>
                      setUserHasVoted({ ...userHasVoted, [question._id]: true })
                    }
                  />
                )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="text-center">Loading questions...</div>
        )}
      <div className="flex justify-center m-2 ">
        <Button
          onClick={getNewQuestions}
          variant={"outline"}
          className="absolute bottom-7"
        >
          Get New Questions
        </Button>
      </div>
    </div>
  );
};

export default DailyQuestionPage;
