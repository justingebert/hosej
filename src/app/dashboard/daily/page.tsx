"use client";

import React, { useState, useEffect, Suspense} from "react";
import { useUser } from "../../../context/UserContext";
import VoteOptions from "../../../components/VotingOptions.client";
import VoteResults from "../../../components/VoteResults.client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { unstable_noStore } from "next/cache";
import { useRouter } from "next/navigation";
import { useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ArrowLeft } from 'lucide-react';

function QuestionsTabs({ questions, userHasVoted, setUserHasVoted }:any) {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('returnTo') || (questions.length > 0 ? questions[0]._id : undefined);

  return (
    <Tabs defaultValue={defaultTab}>
        <div className="flex justify-center mt-5">
      <TabsList>

        {questions.map((question:any, index:number) => (
          <TabsTrigger key={question._id} value={question._id}>
            {"Daily " + (index + 1)}
          </TabsTrigger>
        ))}

      </TabsList>
        </div>
      {questions.map((question:any) => (
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
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const router = useRouter();

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
      setAlertMessage(data.message);
      setIsAlertOpen(true);
    }

    if (data.questions) {
      setQuestions(data.questions);
      console.log(data.questions);
      const votes = data.questions.reduce((acc: any, question: any) => {
        acc[question._id] = question.answers.some(
          (answer: any) => answer.username.username === username
        );
        return acc;
      }, {});
      setUserHasVoted(votes);
    };
  };

  return (
    <div className="m-6">
      <div className="flex items-center">
        <Link className="text-lg leading-none mr-auto cursor-pointer" href="/">
          <ArrowLeft/>
        </Link>
      </div>
      <h1 className="text-xl font-bold text-center">Daily Questions</h1>
      {questions.length > 0 ? (
        <Suspense fallback={<div>Loading questions...</div>}>
          <QuestionsTabs
            questions={questions}
            userHasVoted={userHasVoted}
            setUserHasVoted={setUserHasVoted}
          />
        </Suspense>
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
      {isAlertOpen && (
                <AlertDialog open={isAlertOpen} >
                    <AlertDialogContent className="rounded-lg w-3/4">
                        <AlertDialogDescription>
                            {alertMessage}
                        </AlertDialogDescription>
                        <AlertDialogFooter>
                            <AlertDialogAction onClick={() => setIsAlertOpen(false)}>OK</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
    </div>
  );
};

export default DailyQuestionPage;
