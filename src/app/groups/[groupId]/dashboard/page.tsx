"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { History, Ellipsis, BarChartBig, Menu } from 'lucide-react';
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CompletionChart } from "@/components/Charts/CompletionChart";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Dashboard() {
  const router = useRouter();
  const [userCount, setUserCount] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [completion, setCompletion] = useState(0);
  const { groupId } = useParams<{ groupId: string }>();

  useEffect(() => {
    const fetchUserCount = async () => {
      const response = await fetch(`/api/${groupId}/users/count`);
      const data = await response.json();
      setUserCount(data);
    };
    fetchUserCount();
  }, [groupId, userCount]);


  useEffect(() => {
    if (userCount > 0) {
      const fetchQuestions = async () => {
        const response = await fetch(`/api/${groupId}/question/daily`);
        const data = await response.json();
        setQuestions(data.questions);
        calculateCompletion(data.questions, userCount); 
      };
      fetchQuestions();
    }
  }, [groupId, userCount]);

  const calculateCompletion = (questions: any, userCount: number) => {
    if (questions.length === 0) {
      setCompletion(0);
      return;
    }
    
    let totalVotes = 0;
    let totalRequiredVotes = questions.length * userCount;

    questions.forEach((question: any) => {
      totalVotes += question.answers.length;
    });

    const completionPercentage = (totalVotes / totalRequiredVotes) * 100;
    console.log("completionPercentage", completionPercentage);
    setCompletion(Math.round(completionPercentage)); 
  };

  return (
    <div className="flex flex-col justify-between h-[100dvh]"> 
      <div className="flex justify-between items-center mt-4 w-full">
        <div>
          <Button variant="outline" size="icon" onClick={() => { router.push(`/groups`)}}>
            <Menu />
          </Button>
        </div>
        <Link href={`/groups/${groupId}/stats`}>
          <h1 className="text-4xl font-bold">HoseJ</h1>
        </Link>
        <div>
        <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="no-zoom">
          <Ellipsis className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Ellipsis className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="" align="center">
        <DropdownMenuItem onClick={() => { router.push(`/groups/${groupId}/leaderboard`)}}>
            <span className="mr-2 h-4 w-4">👖</span>
            Leaderboard
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => { router.push(`/groups/${groupId}/history`)}}>
            <History className="mr-2 h-4 w-4"/> History
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => { router.push(`/groups/${groupId}/stats`)}}>
            <BarChartBig className="mr-2 h-4 w-4"/>
              Statistics
          </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

          {/* <Button variant="outline" size="icon" onClick={() => { router.push(`/groups/${groupId}/leaderboard`)}}>
            👖
          </Button> */}
        </div>
      </div>

      <div className="flex flex-col items-center justify-center flex-grow"> {/* Center the cards and button */}
        <div className="flex flex-col items-center gap-8 w-full">
          <Card
            className="bg-primary-foreground w-full  px-6 py-4 flex items-center justify-between cursor-pointer"
            onClick={() => router.push(`/groups/${groupId}/rally`)}
          >
            <div className="flex flex-col justify-center">
              <div className="font-bold text-2xl">Rally</div>
              <div className="text-sm text-primary/30">Vote now!</div>
              <div className="text-lg">Inactive</div> 
            </div>
            <Skeleton className="w-24 h-24  rounded-lg"/> {/* Placeholder for the chart */}
          </Card>
          <Card
            className="bg-primary-foreground w-full px-6 py-4 flex items-center justify-between cursor-pointer"
            onClick={() => router.push(`/groups/${groupId}/daily`)}
          >
            <div className="flex flex-col justify-center">
              <div className="font-bold text-2xl">Daily</div>
              <div className="text-sm text-primary/30">Vote now!</div>
              <div className="text-lg ">Active: {questions.length}</div> 
            </div>
            <div className="w-24 h-24 rounded-lg">
            <CompletionChart completion={completion} />
            </div> 
            {/* Placeholder for the chart */}
          </Card>
        </div>
      </div>
      <div className="flex justify-center mb-20">
      <Button
          className="mt-8 w-full"
          onClick={() => router.push(`/groups/${groupId}/create`)}
        >
          Create
        </Button>
      </div>
    </div>
  );
}

