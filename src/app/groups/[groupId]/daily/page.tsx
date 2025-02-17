"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/ui/custom/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import BackLink from "@/components/ui/custom/BackLink";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import { IQuestion } from "@/types/Question";
import QuestionsTabs from "./QuestionTabs";

const DailyQuestionPage = () => {
  const { session, user } = useAuthRedirect();
  const { groupId } = useParams<{ groupId: string }>();
  const router = useRouter();
  const [userHasVoted, setUserHasVoted] = useState<any>({});
  const [selectedRating, setSelectedRating] = useState<any>({});

  // Fetch questions data using SWR
  const { data, error, isLoading } = useSWR<{ questions: IQuestion[] }>(
    user ? `/api/groups/${groupId}/question/daily` : null, fetcher);

  useEffect(() => {
    if (data?.questions?.length && user) {
      // Calculate user votes
      const votes = data.questions.reduce((acc: any, question: any) => {
        acc[question._id] = question.answers.some(
          (answer: any) => answer.user === user._id
        );
        return acc;
      }, {});
      setUserHasVoted(votes);

      // Calculate user ratings
      const ratings = data.questions.reduce((acc: any, question: any) => {
        if (question.rating.good.includes(user._id)) acc[question._id] = "good";
        else if (question.rating.ok.includes(user._id)) acc[question._id] = "ok";
        else if (question.rating.bad.includes(user._id)) acc[question._id] = "bad";
        return acc;
      }, {});
      setSelectedRating(ratings);
      data.questions = [];
    }
  }, [data, user]);

  if (error) return <p className="text-red-500">Failed to load questions</p>;

  return (
    <div className="flex flex-col h-[100dvh]">
      <Header leftComponent={<BackLink href={`/groups/${groupId}/dashboard`} />} title="Daily Questions" />

      {isLoading || !data ? (
        <div className="flex flex-col">
          <Skeleton className="w-full h-10 mb-6" />
          <Skeleton className="w-full h-20 mb-6" />
          <Skeleton className="w-full h-[300px] mb-6" />
          <Skeleton className="w-full h-[300px] mb-6" />
        </div>
      ) : data.questions && data.questions.length > 0 ? (
        <QuestionsTabs
          user={user}
          groupId={groupId}
          questions={data.questions}
          userHasVoted={userHasVoted}
          setUserHasVoted={setUserHasVoted}
          selectedRating={selectedRating}
          setSelectedRating={setSelectedRating}
        />
      ) : (
        <div className="flex flex-grow justify-center items-center">
          <Card className="w-full">
            <CardContent className="flex flex-col justify-center">
              <h2 className="font-bold p-6 text-center text-xl text-nowrap">{"No questions available :("}</h2>
              <Button onClick={() => router.push(`/groups/${groupId}/create`)}>
                Create Questions
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DailyQuestionPage;
