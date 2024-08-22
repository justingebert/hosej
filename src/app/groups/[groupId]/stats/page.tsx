"use client";

import React, { useState, useEffect } from "react";
import { RadialBarChart, RadialBar, PolarRadiusAxis, Label } from "recharts";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
} from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useParams, useRouter } from "next/navigation";
import ThemeSelector from "@/components/ui/ThemeSelector";
import Loader from "@/components/ui/Loader";
import Header from "@/components/ui/Header";

type Statistics = {
  userCount: number;
  questionsUsedCount: number;
  questionsLeftCount: number;
  messagesCount: number;
  RalliesUsedCount: number;
  RalliesLeftCount: number;
};

const fetchStatistics = async (groupId:string): Promise<Statistics> => {
  const response = await fetch(`/api/${groupId}/stats`);
  if (!response.ok) {
    throw new Error('Failed to fetch statistics');
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
  }, []);

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (loading) return <Loader loading={true} />
  if (!stats) return <p>No statistics avaiable</p>

  const chartDataQuestions = [
    { questionsUsedCount: stats.questionsUsedCount, questionsLeftCount: stats.questionsLeftCount }
  ];

  const totalQuestions = chartDataQuestions[0].questionsUsedCount + chartDataQuestions[0].questionsLeftCount;

  const chartDataRallies = [
    { RalliesUsedCount: stats.RalliesUsedCount, RalliesLeftCount: stats.RalliesLeftCount }
  ];

  const totalRallies = chartDataRallies[0].RalliesUsedCount + chartDataRallies[0].RalliesLeftCount;

  const chartConfig = {
    questions: {
      label: "Questions",
      color: "hsl(var(--chart-1))",
    },
    questionsleft: {
      label: "Questions Left",
      color: "hsl(var(--chart-3))",
    },
    rallies: {
      label: "Rallies",
      color: "hsl(var(--chart-1))",
    },
    ralliesleft: {
      label: "Rallies Left",
      color: "hsl(var(--chart-4))",
    },
  } satisfies ChartConfig;

  return (
    <div>
      <Header href={`/groups/${groupId}/dashboard`} rightComponent={<ThemeSelector />} />
      <Card className="flex flex-col mb-4 w-full">
        <CardHeader className="items-center">
          <CardTitle>Questions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center -mt-6">
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square w-full"
          >
            <RadialBarChart
              data={chartDataQuestions}
              endAngle={180}
              innerRadius={80}
              outerRadius={130}
            >
              <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) - 16}
                            className="fill-foreground text-2xl font-bold"
                          >
                            {totalQuestions.toLocaleString()}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 4}
                            className="fill-muted-foreground"
                          >
                            Questions
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </PolarRadiusAxis>
              <RadialBar
                dataKey="questionsLeftCount"
                stackId="a"
                fill="var(--color-questionsleft)"
                cornerRadius={3}
                className="stroke-transparent stroke-2"
              />
              <RadialBar
                dataKey="questionsUsedCount"
                stackId="a"
                fill="var(--color-questions)"
                cornerRadius={3}
                className="stroke-transparent stroke-2"
              />
            </RadialBarChart>
          </ChartContainer>
          <div className="-mt-20 text-center text-xl">
            Questions Left:{" "}
            <span className="text-chart-3 font-bold">
              {stats.questionsLeftCount}
            </span>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center z-10">
            <Button variant="outline" onClick={() => router.push(`/groups/${groupId}/dashboard/create`)}>Create</Button>
        </CardFooter>
      </Card>

      <Card className="flex flex-col mb-4 w-full">
        <CardHeader className="items-center">
          <CardTitle>Rallies</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center -mt-6">
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square w-full"
          >
            <RadialBarChart
              data={chartDataRallies}
              endAngle={180}
              innerRadius={80}
              outerRadius={130}
              className=""
            >
              <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) - 16}
                            className="fill-foreground text-2xl font-bold"
                          >
                            {totalRallies.toLocaleString()}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 4}
                            className="fill-muted-foreground"
                          >
                            Rallies
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </PolarRadiusAxis>
              <RadialBar
                dataKey="RalliesLeftCount"
                stackId="a"
                fill="var(--color-ralliesleft)"
                cornerRadius={3}
                className="stroke-transparent stroke-2"
              />
              <RadialBar
                dataKey="RalliesUsedCount"
                stackId="a"
                fill="var(--color-rallies)"
                cornerRadius={3}
                className="stroke-transparent stroke-2"
              />
            </RadialBarChart>
          </ChartContainer>
          <div className="-mt-20 text-center text-xl">
            Rallies Left:{" "}
            <span className="text-chart-4 font-bold">
              {stats.RalliesLeftCount}
            </span>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center z-10">
            <Button variant="outline" onClick={() => router.push(`/groups/${groupId}/dashboard/create`)} >Create</Button>
        </CardFooter>
      </Card>

      <Table className="w-full max-w-md mb-4">
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">User Count</TableCell>
            <TableCell>{stats.userCount}</TableCell>
          </TableRow>
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
