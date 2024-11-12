"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {  BarChartBig, Menu, ScanSearch, MousePointerClick, CircleSlash, Settings} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { CompletionChart } from "@/components/Charts/CompletionChart";
import confetti from "canvas-confetti";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import TabsLayout from "../TabsLayout";

export default function Dashboard() {
  const router = useRouter();
  const [group, setGroup] = useState<any>({});
  const [userCount, setUserCount] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [rallies, setRallies] = useState<any>([]);
  const [completion, setCompletion] = useState(0);
  const { groupId } = useParams<{ groupId: string }>();

  useEffect(() => {
    const fetchUserCount = async () => {
      const response = await fetch(`/api/groups/${groupId}`);
      const data = await response.json();
      setUserCount(data.members.length);
      setGroup(data);
    };
    fetchUserCount();
    if(userCount > 0) {
      const fetchQuestions = async () => {
        const response = await fetch(`/api/groups/${groupId}/question/daily`);
        const data = await response.json();
        setQuestions(data.questions);
        calculateCompletion(data.questions, userCount); 
      };
      fetchQuestions();
      const fetchRallies = async () => {
        const response = await fetch(`/api/groups/${groupId}/rally`);
        const data = await response.json();
        setRallies(data.rallies);
      }
      fetchRallies();
    }
  }, [groupId, userCount]);


  const triggerConfetti = () => {
    const scalar = 2
    const hose = confetti.shapeFromText({ text: '👖', scalar });

    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      shapes: [hose],
      scalar
    });
  };

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
    if (completionPercentage >= 100) {
      triggerConfetti();
    }
    setCompletion(Math.round(completionPercentage)); 
  };

  const titleClass = group.name && group.name.length > 15 ? "text-2xl" : "text-4xl";

  return (
    <TabsLayout>
      <div className="flex justify-between items-center mt-4 w-full">
          <Button variant="outline" size="icon" onClick={() => { router.push(`/groups`)}}>
            <Menu />
          </Button>
        <h1 className={`flex-grow ${titleClass} font-bold text-center break-words`}>
            {group.name}
        </h1>
        <Link href={`/groups/${groupId}/settings`}>
          <Button variant="outline" size="icon" className="no-zoom">
            <Settings />
          </Button>
        </Link>
      </div>

      
        <div className="flex flex-col items-center gap-8 w-full">
          <Card
            className="relative bg-primary-foreground w-full  px-6 py-4 flex items-center justify-between cursor-pointer"
            onClick={() => router.push(`/groups/${groupId}/rally`)}
          > 
            {rallies.length > 0 && (
              <div className="absolute -top-3 -right-3">
                <Badge>{rallies.length}</Badge> {/* Customize badge content */}
              </div>
            )}
            <div className="flex flex-col justify-center">
              <div className="font-bold text-2xl">Rally</div>
              {rallies.length > 0 && !rallies[0].resultsShowing && !rallies[0].votingOpen && <div className="text-sm text-primary/30">Submit now!</div>}
              {rallies.length > 0 && rallies[0].votingOpen && <div className="text-sm text-primary/30">Vote now!</div>}
              {rallies.length > 0 && rallies[0].resultsShowing && <div className="text-sm text-primary/30">View results!</div>}
              {rallies.length === 0 ? <div className="text-lg">Inactive</div> :
              <div className="text-lg">Active</div> }
            </div>
            <div className="w-24 h-24 rounded-lg flex items-center justify-center">
              {rallies.length > 0 && rallies[0].votingOpen && <MousePointerClick className="w-full h-full p-4" />}
              {rallies.length > 0 && rallies[0].resultsShowing && (<BarChartBig className="w-full h-full p-4 " />
              )}
              {rallies.length > 0 && !rallies[0].votingOpen && !rallies[0].resultsShowing && (<ScanSearch className="w-full h-full p-4" />)} 
              {rallies.length === 0 && (  <CircleSlash  className="w-full h-full p-4 text-secondary" />)}
            </div>
          </Card>
          <Card
            className="relative  bg-primary-foreground w-full px-6 py-4 flex items-center justify-between cursor-pointer"
            onClick={() => router.push(`/groups/${groupId}/daily`)}
          >
            {questions.length > 0 && (
              <div className="absolute -top-3 -right-3">
              <Badge>{questions.length}</Badge>
            </div>
            )}
            <div className="flex flex-col justify-center">
              <div className="font-bold text-2xl">Daily</div>
              <div className="text-sm text-primary/30">Vote now!</div>
              {questions.length === 0 ? <div className="text-lg">Inactive</div> :
              <div className="text-lg">Active</div> }
            </div>
            <div className="w-24 h-24 rounded-lg">
              <CompletionChart completion={completion} />
            </div> 
          </Card>
        </div>
      <div className="flex justify-center mb-20">
      <Button
          className="mt-8 w-full"
          onClick={() => router.push(`/groups/${groupId}/create`)}
        >
          Create
        </Button>
      </div>
    </TabsLayout>
  );
}

