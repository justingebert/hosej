"use client";

import React, { useState, useEffect } from "react";
import { ClipLoader } from "react-spinners";
import Link from "next/link";
import { ArrowLeft, Divide } from "lucide-react";
import { RadialBarChart, RadialBar, PolarRadiusAxis, Label } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

type Statistics = {
  userCount: number;
  questionCount: number;
  questionsLeftCount: number;
  messagesCount: number;
  RallyCount: number;
  RalliesLeftCount: number;
};

const fetchStatistics = async (): Promise<Statistics> => {
  const response = await fetch('/api/stats');
  if (!response.ok) {
    throw new Error('Failed to fetch statistics');
  }
  return response.json();
};

const StatsPage = () => {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsData = await fetchStatistics();
        setStats(statsData);
      } catch (error: any) {
        setError(error.message);
      }
    };
    fetchData();
  }, []);

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-screen">
        <ClipLoader size={50} color={"#000000"} loading={true} />
      </div>
    );
  }

  const chartDataQuestions = [
    { questionCount: stats.questionCount, questionsLeftCount: stats.questionsLeftCount }];

  const totalQuestions = chartDataQuestions[0].questionCount + chartDataQuestions[0].questionsLeftCount;

  const chartDataRallies = [
    { name: 'Rallies', value: stats.RallyCount },
    { name: 'Rallies Left', value: stats.RalliesLeftCount }
  ];

  const chartConfig = {
    questions: {
      label: "Questions",
      color: "#8284d8",
    },
    questionsleft: {
      label: "Questions Left",
      color: "#82ca9d",
    },
    rallies: {
      label: "Rallies",
      color: "#8884d8",
    },
    "Rallies Left": {
      label: "Rallies Left",
      color: "#82ca9d",
    },
  } satisfies ChartConfig;

  return (
    <div className="m-6 flex flex-col items-center">
      <div className="flex items-center w-full mb-4">
        <Link className="text-lg leading-none mr-auto cursor-pointer" href="/">
          <ArrowLeft />
        </Link>
      </div>

      <Card className="flex flex-col mb-4 w-full">
        <CardHeader className="items-center">
          <CardTitle>Questions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 items-center">
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square w-full"
          >
            <RadialBarChart
              data={chartDataQuestions}
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
                      )
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
                dataKey="questionCount"
                stackId="a"
                fill="var(--color-questions)"
                cornerRadius={3}
                className="stroke-transparent stroke-2"
              />
            </RadialBarChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="outline">Create</Button>
        </CardFooter>
      </Card>

      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>Rallies</CardTitle>
          <CardDescription>Total and Remaining</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 items-center pb-0">
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square w-full max-w-[250px] p-10"
          >
            <RadialBarChart
              data={chartDataRallies}
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
                            {stats.RallyCount.toLocaleString()}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 4}
                            className="fill-muted-foreground"
                          >
                            Rallies
                          </tspan>
                        </text>
                      )
                    }
                  }}
                />
              </PolarRadiusAxis>
              <RadialBar
                dataKey="value"
                fill="var(--color-rallies)"
                cornerRadius={5}
                className="stroke-transparent stroke-2"
              />
            </RadialBarChart>
          </ChartContainer>
        </CardContent>
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
