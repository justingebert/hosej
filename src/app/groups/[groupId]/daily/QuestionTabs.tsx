"use client";

import React, { useState, useEffect } from "react";
import VoteOptions from "@/components/Question/VotingOptions.client";
import VoteResults from "@/components/Question/VoteResults.client";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

export default function QuestionsTabs({
  user,
  groupId,
  questions,
  userHasVoted,
  setUserHasVoted,
  selectedRating,
  setSelectedRating,
}: any) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [ratings, setRatings] = useState<any>({});
  const searchParams = useSearchParams();
  const router = useRouter();
  const defaultTab =
    searchParams.get("returnTo") ||
    (questions.length > 0 ? questions[0]._id : undefined);

  useEffect(() => {
    const initialRatings = questions.reduce((acc: any, question: any) => {
      acc[question._id] = {
        bad: question.rating.bad || [],
        ok: question.rating.ok || [],
        good: question.rating.good || [],
      };
      return acc;
    }, {});
    setRatings(initialRatings);
  }, [questions]);

  const rateQuestion = async (questionId: string, rating: string) => {
    await fetch(`/api/groups/${groupId}/question/${questionId}/rate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: rating }),
    });

    setSelectedRating((prevState: any) => ({
      ...prevState,
      [questionId]: rating,
    }));

    setRatings((prevRatings: any) => {
      const updatedQuestionRatings = { ...prevRatings[questionId] };
      updatedQuestionRatings[rating] = [
        ...(updatedQuestionRatings[rating] || []),
        user._id,
      ];

      return {
        ...prevRatings,
        [questionId]: updatedQuestionRatings,
      };
    });
  };

  const handleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleTabChange = (tabValue: string) => {
    console.log("[handleTabChange] Switching to tab:", tabValue);
    router.push(`/groups/${groupId}/daily?returnTo=${tabValue}`);
  };

  return (
    <Tabs defaultValue={defaultTab} onValueChange={handleTabChange}>
      <TabsList
        className="grid w-full mb-10"
        style={{
          gridTemplateColumns: `repeat(${questions.length}, minmax(0, 1fr))`,
        }}
      >
        {questions.map((question: any, index: number) => (
          <TabsTrigger key={question._id} value={question._id}>
            {"Daily " + (index + 1)}
          </TabsTrigger>
        ))}
      </TabsList>
      {questions.map((question: any) => (
        <TabsContent key={question._id} value={question._id}>
          {RatingDrawer(
            drawerOpen,
            setDrawerOpen,
            question,
            ratings,
            selectedRating,
            rateQuestion
          )}

          {question.imageUrl && (
            <Image
              src={question.imageUrl}
              alt={`${question.question}`}
              className="object-cover w-full h-full cursor-pointer rounded-lg mt-4"
              width={300}
              height={300}
            />
          )}
          <div className="mt-10">
            {userHasVoted[question._id] ? (
              <VoteResults
                user={user}
                question={question}
                available={true}
                returnTo={`daily?returnTo=${question._id}`}
              />
            ) : (
              <VoteOptions
                question={question}
                onVote={() => {
                  setUserHasVoted({ ...userHasVoted, [question._id]: true });
                  handleDrawer();
                }}
              />
            )}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}

function RatingDrawer(
  drawerOpen: boolean,
  setDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>,
  question: any,
  ratings: any,
  selectedRating: any,
  rateQuestion: (questionId: string, rating: string) => Promise<void>
) {
  return (
    <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
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
          <Badge>🐟{ratings[question._id]?.bad?.length || 0}</Badge>
          <Badge>👍{ratings[question._id]?.ok?.length || 0}</Badge>
          <Badge>🐐{ratings[question._id]?.good?.length || 0}</Badge>
        </div>
        <div className="flex flex-row space-x-4 p-4">
          <Button
            className="text-3xl flex-1 py-8 h-full"
            variant={
              selectedRating[question._id] === "bad" ? "default" : "secondary"
            }
            onClick={() => rateQuestion(question._id, "bad")}
            disabled={Boolean(selectedRating[question._id])} // Disable if already rated
          >
            🐟
          </Button>
          <Button
            className="text-3xl flex-1 py-8 h-full"
            variant={
              selectedRating[question._id] === "ok" ? "default" : "secondary"
            }
            onClick={() => rateQuestion(question._id, "ok")}
            disabled={Boolean(selectedRating[question._id])} // Disable if already rated
          >
            👍
          </Button>
          <Button
            className="text-3xl flex-1 py-8 h-full"
            variant={
              selectedRating[question._id] === "good" ? "default" : "secondary"
            }
            onClick={() => rateQuestion(question._id, "good")}
            disabled={Boolean(selectedRating[question._id])} // Disable if already rated
          >
            🐐
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
