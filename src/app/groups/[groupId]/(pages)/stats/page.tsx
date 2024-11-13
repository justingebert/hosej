"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { useParams } from "next/navigation";
import SpinningLoader from "@/components/ui/custom/SpinningLoader";
import Header from "@/components/ui/custom/Header";
import { QuestionsByType, QuestionsByUser } from "@/components/Charts/QuestionCharts"; 
import { Separator } from "@/components/ui/separator";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";

type Statistics = {
  group :any
  userCount: number;
  questionsUsedCount: number;
  questionsLeftCount: number;
  questionsByType: { _id: string; count: number }[]; 
  questionsByUser: { _id: string; count: number }[];
  messagesCount: number;
  RalliesUsedCount: number;
  RalliesLeftCount: number;
};


const StatsPage = () => {
  const { groupId } = useParams<{ groupId: string }>();

  const { data: stats, isLoading } = useSWR<Statistics>(`/api/groups/${groupId}/stats`, fetcher);

  if (isLoading) return <SpinningLoader loading={true} />;
  if (!stats) return <p>No statistics available</p>;

  const chartDataQuestions = [
    { questionsUsedCount: stats.questionsUsedCount, questionsLeftCount: stats.questionsLeftCount },
  ];

  const totalQuestions =
    chartDataQuestions[0].questionsUsedCount + chartDataQuestions[0].questionsLeftCount;

  const chartDataRallies = [
    { RalliesUsedCount: stats.RalliesUsedCount, RalliesLeftCount: stats.RalliesLeftCount },
  ];

  const totalRallies = chartDataRallies[0].RalliesUsedCount + chartDataRallies[0].RalliesLeftCount;


  return (
    <div>
      <Header title="Statistics" />
      <Separator className="my-6" />
      <h2 className="text-xl font-bold mb-4 text-center">Questions</h2>
      <Table className="w-full max-w-md">
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">Questions Used</TableCell>
            <TableCell>{stats.questionsUsedCount}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Questions Left</TableCell>
            <TableCell>{stats.questionsLeftCount}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Total Questions</TableCell>
            <TableCell>{totalQuestions}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <div className="my-6">
        <QuestionsByUser data={stats.questionsByUser} />
      </div>
      <div className="my-6">
        <QuestionsByType data={stats.questionsByType} />
      </div>

      <Separator className="my-6" />

      <h2 className="text-xl font-bold text-center">Rallies</h2>
      <Table className="w-full max-w-md">
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">Rally Gap in Days</TableCell>
            <TableCell>{stats.group.rallyGapDays}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Rallies Used</TableCell>
            <TableCell>{stats.RalliesUsedCount}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Rallies Left</TableCell>
            <TableCell>{stats.RalliesLeftCount}</TableCell>
          </TableRow>
                    <TableRow>
            <TableCell className="font-medium">Total Rallies</TableCell>
            <TableCell>{totalRallies}</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <Separator className="my-6" />

      <h2 className="text-xl font-bold text-center">Users</h2>
      <Table className="w-full max-w-md">
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">User Count</TableCell>
            <TableCell>{stats.group.members.length}</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      
  
      <Separator className="my-6" />

      <h2 className="text-xl font-bold mb-4 text-center">Messages</h2>
      <Table className="w-full max-w-md mb-6">
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">Message Count</TableCell>
            <TableCell>{stats.messagesCount}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
  
};

export default StatsPage;
