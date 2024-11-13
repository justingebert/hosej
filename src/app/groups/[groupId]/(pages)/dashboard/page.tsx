"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {  BarChartBig, Menu, ScanSearch, MousePointerClick, CircleSlash, Settings, CirclePlus} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { CompletionChart } from "@/components/Charts/CompletionChart";
import confetti from "canvas-confetti";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import useSWR, { useSWRConfig } from "swr";
import fetcher from "@/lib/fetcher";
import { IGroup } from "@/db/models/Group";
import { IQuestion } from "@/types/Question";
import { IRally } from "@/db/models/rally";

export default function Dashboard() {
  const router = useRouter();
  const { mutate } = useSWRConfig()
  const { groupId } = useParams<{ groupId: string }>();
  const { data: group } = useSWR<IGroup>(`/api/groups/${groupId}`, fetcher);
  const { data: questionsData } = useSWR<{questions: IQuestion[]}>(group ? `/api/groups/${groupId}/question/daily` : null, fetcher);
  const { data: ralliesData } = useSWR<{rallies: IRally[]}>(group ? `/api/groups/${groupId}/rally` : null, fetcher);

  const questions = questionsData?.questions || [];
  const rallies = ralliesData?.rallies || [];

  const triggerConfetti = () => {
    const scalar = 2;
    const hose = confetti.shapeFromText({ text: '👖', scalar });
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      shapes: [hose],
      scalar
    });
  };

  // Calculate completion based on questions and group members
  const calculateCompletion = (questions: IQuestion[], userCount: number) => {
    if (!Array.isArray(questions) || questions.length === 0 || userCount === 0) return 0;
    
    const totalVotes = questions.reduce((acc, question) => acc + (question.answers?.length || 0), 0);
    const completionPercentage = (totalVotes / (questions.length * userCount)) * 100;
  
    if (completionPercentage >= 100) triggerConfetti();
    return Math.round(completionPercentage);
  };

  const completion = group ? calculateCompletion(questions, group.members?.length || 0) : 0;

  const titleClass = group?.name && group.name.length > 15 ? "text-2xl" : "text-4xl";

  return (
    <>
      <div className="flex justify-between items-center mt-4">
        <Button variant="outline" size="icon" onClick={() => { router.push(`/groups`)}}>
          <Menu />
        </Button>
        <h1 className={`flex-grow ${titleClass} font-bold text-center break-words`}>
          {group?.name}
        </h1>
        <Link href={`/groups/${groupId}/settings`}>
          <Button variant="outline" size="icon">
            <Settings />
          </Button>
        </Link>
      </div>

  <div className="flex flex-col flex-grow justify-center items-center gap-8 h-[70dvh]">
    <Card
      className="relative bg-primary-foreground w-full px-6 py-4 flex items-center justify-between"
      onClick={() => router.push(`/groups/${groupId}/rally`)}
    > 
      {rallies.length > 0 && (
        <div className="absolute -top-3 -right-3">
          <Badge>{rallies.length}</Badge>
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
      className="relative bg-primary-foreground w-full px-6 py-4 flex items-center justify-between"
      onClick={() => {
        mutate(`/api/groups/${groupId}/question/daily`)
        router.push(`/groups/${groupId}/daily`)
      }}
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
    <Button
      className="w-full h-12 font-bold"
      onClick={() => router.push(`/groups/${groupId}/create`)}
    > 
      Create
    </Button>
  </>
  );
}