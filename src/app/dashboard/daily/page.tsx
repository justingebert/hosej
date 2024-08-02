"use client";

import React, { useState, useEffect, use } from "react";
import { useUser } from "@/components/UserContext";
import VoteOptions from "@/components/Question/VotingOptions.client";
import VoteResults from "@/components/Question/VoteResults.client";
import { useRouter } from "next/navigation";
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BackLink from "@/components/BackLink";
import Loader from "@/components/Loader";
import Header from "@/components/Header";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

function QuestionsTabs({ questions, userHasVoted, setUserHasVoted }: any) {
  const { username } = useUser();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('returnTo') || (questions.length > 0 ? questions[0]._id : undefined);
  const [userRated, setUserRated] = useState<{ [key: string]: boolean }>({});



  const rateQuestion = async (questionId: string, username:string, rating: string) => {
    await fetch(`/api/question/${questionId}/rate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username:username, rating:rating }),
    });

    setUserRated((prevState) => ({
      ...prevState,
      [questionId]: true,
    }));
  }


  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList
        className="grid w-full mb-10"
        style={{ gridTemplateColumns: `repeat(${questions.length}, minmax(0, 1fr))` }}
      >
          {questions.map((question: any, index: number) => (
            <TabsTrigger key={question._id} value={question._id}>
              {"Daily " + (index + 1)}
            </TabsTrigger>
          ))}
        </TabsList>
      {questions.map((question: any) => (
        <TabsContent key={question._id} value={question._id}>
          <Popover>
          <PopoverTrigger className="w-full">
          <Card className=" bg-foreground text-center">
                <h2 className="font-bold p-6 text-secondary">{question.question}</h2>
              </Card>
          </PopoverTrigger>
          <PopoverContent>
            <div className="flex flex-col space-y-2">
            <Button className="w-full" onClick={() => {rateQuestion(question._id, username, "good")}} >🐐</Button>
            <Button className="w-full" onClick={() => {rateQuestion(question._id, username, "ok")}} >👍</Button>
            <Button className="w-full" onClick={() => {rateQuestion(question._id, username, "bad")}} >🐟</Button>
            </div>
            </PopoverContent>
      </Popover>
        
        
          <div className="mt-10">
            {userHasVoted[question._id] ? (
              <VoteResults question={question} avaiable={true}/>
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
  const [loading, setLoading] = useState(true);
  const { username } = useUser();
  const [questions, setQuestions] = useState<any>([]);
  const [userHasVoted, setUserHasVoted] = useState<any>({});
  const [activeTab, setActiveTab] = useState<string | undefined>();
  const router = useRouter();

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      router.refresh();
      const res = await fetch(`/api/question/daily`, { cache: "no-store" });
      const data = await res.json();

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
      setLoading(false);
    };

    if (username) {
      fetchQuestions();
    }
  }, [username, router]);

  if (loading) return <Loader loading={true} />
  if (!questions) return <p>No Questions avaiable</p>

  return (
    <>
      <Header href="/" title="Daily Questions" />
      <QuestionsTabs
        questions={questions}
        userHasVoted={userHasVoted}
        setUserHasVoted={setUserHasVoted}
      />
    </>
  );
};

export default DailyQuestionPage;