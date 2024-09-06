"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { useParams, useRouter } from "next/navigation";
import Loader from "@/components/ui/Loader";
import Header from "@/components/ui/Header";
import { QuestionsByType, QuestionsByUser } from "@/components/Charts/QuestionCharts"; 
import { Separator } from "@/components/ui/separator";

type Statistics = {
  group :any
  userCount: number;
  questionsUsedCount: number;
  questionsLeftCount: number;
  questionsByType: { _id: string; count: number }[]; // New field for questions by type
  questionsByUser: { _id: string; count: number }[]; // New field for questions by user
  messagesCount: number;
  RalliesUsedCount: number;
  RalliesLeftCount: number;
};

const fetchStatistics = async (groupId: string): Promise<Statistics> => {
  const response = await fetch(`/api/${groupId}/stats`);
  if (!response.ok) {
    throw new Error("Failed to fetch statistics");
  }
  return response.json();
};

const StatsPage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Statistics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { groupId } = useParams<{ groupId: string }>();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const statsData = await fetchStatistics(groupId);
        setStats(statsData);
      } catch (error: any) {
        setError(error.message);
      }
      setLoading(false);
    };
    fetchData();
  }, [groupId]);

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (loading) return <Loader loading={true} />;
  if (!stats) return <p>No statistics available</p>;

  const chartDataQuestions = [
    { questionsUsedCount: stats.questionsUsedCount, questionsLeftCount: stats.questionsLeftCount },
  ];

  const totalQuestions = chartDataQuestions[0].questionsUsedCount + chartDataQuestions[0].questionsLeftCount;

  const chartDataRallies = [
    { RalliesUsedCount: stats.RalliesUsedCount, RalliesLeftCount: stats.RalliesLeftCount },
  ];

  const totalRallies = chartDataRallies[0].RalliesUsedCount + chartDataRallies[0].RalliesLeftCount;

  return (
    <div>
      <Header href={`/groups/${groupId}/dashboard`} />
  
      {/* User Section */}
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
  
      {/* Questions Section */}
      <h2 className="text-xl font-bold mb-4 text-center">Questions</h2>
      <Table className="w-full max-w-md">
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">Questions per Run</TableCell>
            <TableCell>{stats.group.questionCount}</TableCell>
          </TableRow>
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
      <Table className="w-full max-w-md mb-6">
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">Rallies per Run</TableCell>
            <TableCell>{stats.group.rallyCount}</TableCell>
          </TableRow>
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
