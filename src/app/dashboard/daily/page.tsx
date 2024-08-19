"use client";

import React, { useState, useEffect, use } from "react";
import { useUser } from "@/components/UserContext";
import VoteOptions from "@/components/Question/VotingOptions.client";
import VoteResults from "@/components/Question/VoteResults.client";
import { useRouter } from "next/navigation";
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BackLink from "@/components/ui/BackLink";
import Loader from "@/components/ui/Loader";
import Header from "@/components/ui/Header";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";

function QuestionsTabs({ questions, userHasVoted, setUserHasVoted, selectedRating, setSelectedRating }: any) {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('returnTo') || (questions.length > 0 ? questions[0]._id : undefined);
  const [userRated, setUserRated] = useState<{ [key: string]: boolean }>({});


  const rateQuestion = async (questionId: string, rating: string) => {
    await fetch(`/api/question/${questionId}/rate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username:user.username, rating:rating }),
    });

    setSelectedRating((prevState: any) => ({
      ...prevState,
      [questionId]: rating,
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
          <Drawer>
          <DrawerTrigger className="w-full">
          <Card className=" bg-foreground text-center">
                <h2 className="font-bold p-6 text-secondary">{question.question}</h2>
              </Card>
          </DrawerTrigger>
          <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Kann die Frage was?</DrawerTitle>
            <DrawerDescription></DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-row justify-center space-x-4">
            <Badge>🐟{question.rating.bad.count}</Badge>
            <Badge>👍{question.rating.ok.count}</Badge>
            <Badge>🐐{question.rating.good.count}</Badge>
          </div>
            <div className="flex flex-row space-x-4 p-4">
            <Button
                  className="text-3xl flex-1 py-8 h-full"
                  variant={selectedRating[question._id] === "bad" ? "default" : "secondary"}
                  onClick={() => rateQuestion(question._id, "bad")}
                  disabled={Boolean(selectedRating[question._id])} // Disable if already rated
                >
                  🐟
                </Button>
                <Button
                  className="text-3xl flex-1 py-8 h-full"
                  variant={selectedRating[question._id] === "ok" ? "default" : "secondary"}
                  onClick={() => rateQuestion(question._id, "ok")}
                  disabled={Boolean(selectedRating[question._id])} // Disable if already rated
                >
                  👍
                </Button>
                <Button
                  className="text-3xl flex-1 py-8 h-full"
                  variant={selectedRating[question._id] === "good" ? "default" : "secondary"}
                  onClick={() => rateQuestion(question._id, "good")}
                  disabled={Boolean(selectedRating[question._id])} // Disable if already rated
                >
                  🐐
                </Button>
                </div>
            </DrawerContent>
      </Drawer>
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
  const { user } = useUser();
  const [questions, setQuestions] = useState<any>([]);
  const [userHasVoted, setUserHasVoted] = useState<any>({});
  const [userHasRated, setUserHasRated] = useState<any>({});
  const [selectedRating, setSelectedRating] = useState<any>({});
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
            (answer: any) => answer.username.username === user.username
          );
          return acc;
        }, {});
        setUserHasVoted(votes);

        const ratings = data.questions.reduce((acc: any, question: any) => {
          if (question.rating.good.usernames.includes(user.username)) acc[question._id] = "good";
          else if (question.rating.ok.usernames.includes(user.username)) acc[question._id] = "ok";
          else if (question.rating.bad.usernames.includes(user.username)) acc[question._id] = "bad";
          return acc;
        }, {});

        setSelectedRating(ratings);
      }
      if (data.message) {
        alert(data.message);//TODO improve
      }
      setLoading(false);
    };

    if (user) {
      fetchQuestions();
    }
  }, [user, router]);

  if (loading) return <Loader loading={true} />
  if (!questions) return <p>No Questions avaiable</p>

  return (
    <>
      <Header href="/" title="Daily Questions" />
      <QuestionsTabs
        questions={questions}
        userHasVoted={userHasVoted}
        setUserHasVoted={setUserHasVoted}
        selectedRating={selectedRating}
        setSelectedRating={setSelectedRating}
      />
    </>
  );
};

export default DailyQuestionPage;