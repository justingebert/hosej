"use client";

import React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useParams } from "next/navigation";
import Header from "@/components/ui/custom/Header";
import { QuestionsByType, QuestionsByUser } from "@/components/Charts/QuestionCharts";
import { Separator } from "@/components/ui/separator";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import { Skeleton } from "@/components/ui/skeleton";
import { IGroupJson } from "@/types/models/group";

type Statistics = {
    group: any;
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
    const params = useParams<{ groupId: string }>();
    const groupId = params? params.groupId : "";

    const { data: stats, isLoading: statsLoading } = useSWR<Statistics>(
        `/api/groups/${groupId}/stats`,
        fetcher
    );
    const { data, isLoading: groupLoading } = useSWR<IGroupJson>(`/api/groups/${groupId}/`, fetcher);

    const sortedUsers = data?.members.sort((a, b) => b.points - a.points) || [];

    let chartDataQuestions = [];
    let totalQuestions = 0;
    let chartDataRallies = [];
    let totalRallies = 0;

    if (stats) {
        chartDataQuestions = [
            {
                questionsUsedCount: stats.questionsUsedCount,
                questionsLeftCount: stats.questionsLeftCount,
            },
        ];
        totalQuestions = stats.questionsUsedCount + stats.questionsLeftCount;

        chartDataRallies = [
            {
                RalliesUsedCount: stats.RalliesUsedCount,
                RalliesLeftCount: stats.RalliesLeftCount,
            },
        ];
        totalRallies = stats.RalliesUsedCount + stats.RalliesLeftCount;
    }

    return (
        <>
            <Header title="Statistics" />
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[100px]">Username</TableHead>
                        <TableHead className="text-right">Points</TableHead>
                        <TableHead className="text-right w-[100px]">Streak</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {groupLoading &&
                        [...Array(10)].map((_, i) => (
                            <TableRow key={i}>
                                <TableCell colSpan={3} className="p-2">
                                    <Skeleton className="h-10" />
                                </TableCell>
                            </TableRow>
                        ))}
                    {sortedUsers.map((member) => (
                        <TableRow key={member.user.toString()}>
                            <TableCell className="font-medium">{member.name}</TableCell>
                            <TableCell className="text-right">{member.points}</TableCell>
                            <TableCell className="text-right font-medium">
                                {member.streak}{" "}
                                <span role="img" aria-label="streak">
                                    👖
                                </span>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <Separator className="my-6" />

            {statsLoading || !stats ? (
                <div>
                    <Skeleton className="h-10 mb-2" />
                    <Skeleton className="h-10 mb-2" />
                    <Skeleton className="h-10 mb-2" />
                    <Skeleton className="h-10 mb-6" />
                    <Skeleton className="h-80 mb-6" />
                    <Skeleton className="h-80" />
                </div>
            ) : (
                <>
                    <h2 className="text-xl font-bold mb-4 text-center">Questions</h2>
                    <Table className="w-full max-w-md mx-auto">
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-medium px-4 py-2 text-left">
                                    Questions Used
                                </TableCell>
                                <TableCell className="px-4 py-2 text-right">
                                    {stats.questionsUsedCount}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium px-4 py-2 text-left">
                                    Questions Left
                                </TableCell>
                                <TableCell className="px-4 py-2 text-right">
                                    {stats.questionsLeftCount}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium px-4 py-2 text-left">
                                    Total Questions
                                </TableCell>
                                <TableCell className="px-4 py-2 text-right">
                                    {totalQuestions}
                                </TableCell>
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
                    <Table className="w-full max-w-md mx-auto">
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-medium px-4 py-2 text-left">
                                    Rally Gap in Days
                                </TableCell>
                                <TableCell className="px-4 py-2 text-right">
                                    {stats.group.rallyGapDays}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium px-4 py-2 text-left">
                                    Rallies Used
                                </TableCell>
                                <TableCell className="px-4 py-2 text-right">
                                    {stats.RalliesUsedCount}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium px-4 py-2 text-left">
                                    Rallies Left
                                </TableCell>
                                <TableCell className="px-4 py-2 text-right">
                                    {stats.RalliesLeftCount}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium px-4 py-2 text-left">
                                    Total Rallies
                                </TableCell>
                                <TableCell className="px-4 py-2 text-right">
                                    {totalRallies}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>

                    <Separator className="my-6" />

                    <h2 className="text-xl font-bold text-center">Users</h2>
                    <Table className="w-full max-w-md mx-auto">
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-medium px-4 py-2 text-left">
                                    User Count
                                </TableCell>
                                <TableCell className="px-4 py-2 text-right">
                                    {stats.group.members.length}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>

                    <Separator className="my-6" />

                    <h2 className="text-xl font-bold mb-4 text-center">Messages</h2>
                    <Table className="w-full max-w-md mx-auto mb-6">
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-medium px-4 py-2 text-left">
                                    Message Count
                                </TableCell>
                                <TableCell className="px-4 py-2 text-right">
                                    {stats.messagesCount}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </>
            )}
        </>
    );
};

export default StatsPage;
