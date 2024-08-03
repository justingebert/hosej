"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { History } from "lucide-react";
import Link from "next/link";
import useFcmToken from "../hooks/useFcmToken";
import { useUser } from "@/components/UserContext"; 
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CompletionChart } from "@/components/CompletionChart";

export default function Home() {
  const router = useRouter();
  const [userCount, setUserCount] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [completion, setCompletion] = useState(0);

  useEffect(() => {
    const user = localStorage.getItem("user");
    console.log("user:", user);
    if (!user) {
      router.push("/signin");
    }
  }, [router]);

  useEffect(() => {
    const fetchUserCount = async () => {
      const response = await fetch("/api/users/count");
      const data = await response.json();
      setUserCount(data);
    };
    fetchUserCount();
  }, []);


  useEffect(() => {
    if (userCount > 0) {
      const fetchQuestions = async () => {
        const response = await fetch("/api/question/daily");
        const data = await response.json();
        setQuestions(data.questions);
        calculateCompletion(data.questions, userCount); 
      };
      fetchQuestions();
    }
  }, [userCount]);

  const calculateCompletion = (questions: any, userCount: number) => {
    console.log("questions:", questions);
    if (questions.length === 0) {
      setCompletion(0);
      return;
    }
    
    let totalVotes = 0;
    let totalRequiredVotes = questions.length * userCount;

    questions.forEach((question: any) => {
      totalVotes += question.answers.length;
    });

    console.log("totalVotes:", totalVotes);
    console.log("totalRequiredVotes:", totalRequiredVotes);

    const completionPercentage = (totalVotes / totalRequiredVotes) * 100;
    setCompletion(Math.round(completionPercentage)); 
  };

  return (
    <div className="flex flex-col justify-between h-[100dvh]"> 
      <div className="flex justify-between items-center mt-4 w-full">
        <div>
          <Button variant="outline" size="icon" onClick={() => { router.push("/dashboard/history") }}>
            <History />
          </Button>
        </div>
        <Link href="/dashboard/stats">
          <h1 className="text-4xl font-bold">HoseJ</h1>
        </Link>
        <div>
          <Button variant="outline" size="icon" onClick={() => { router.push("/dashboard/leaderboard") }}>
            👖
          </Button>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center flex-grow"> {/* Center the cards and button */}
        <div className="flex flex-col items-center gap-8 w-full">
          <Card
            className="bg-primary-foreground w-full p-4 flex items-center justify-between cursor-pointer"
            onClick={() => router.push("/dashboard/rally")}
          >
            <div className="flex flex-col justify-center">
              <div className="font-bold text-2xl">Rally</div>
              <div className="text-sm text-primary/30">Vote now!</div>
              <div className="text-lg">Inactive</div> 
            </div>
            <Skeleton className="w-24 h-24  rounded-lg"/> {/* Placeholder for the chart */}
          </Card>
          <Card
            className="bg-primary-foreground w-full p-4 flex items-center justify-between cursor-pointer"
            onClick={() => router.push("/dashboard/daily")}
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
          onClick={() => router.push("/dashboard/create")}
        >
          Create
        </Button>
      </div>
    </div>
  );
}

