"use client";

import React, { useMemo } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableHead,
    TableRow,
} from "@/components/ui/table";
import { useParams } from "next/navigation";
import Header from "@/components/ui/custom/Header";
import {
    QuestionsByType,
    QuestionsByUser,
} from "@/app/groups/[groupId]/(pages)/stats/_components/QuestionCharts";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import type { GroupDTO, GroupStatsDTO, GroupMemberDTO } from "@/types/models/group";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Calendar, Trophy, Music, Star } from "lucide-react";

function StatCard({
    label,
    value,
    icon,
}: {
    label: string;
    value: string | number;
    icon?: React.ReactNode;
}) {
    return (
        <Card>
            <CardContent className="flex flex-col items-center justify-center p-4">
                {icon && <div className="text-muted-foreground mb-1">{icon}</div>}
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
            </CardContent>
        </Card>
    );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
    return <h2 className="text-lg font-semibold mt-6 mb-3">{children}</h2>;
}

const StatsPage = () => {
    const params = useParams<{ groupId: string }>();
    const groupId = params ? params.groupId : "";

    const { data: stats, isLoading: statsLoading } = useSWR<GroupStatsDTO>(
        `/api/groups/${groupId}/stats`,
        fetcher
    );
    const { data: group, isLoading: groupLoading } = useSWR<GroupDTO>(
        `/api/groups/${groupId}/`,
        fetcher
    );

    const sortedUsers = useMemo(
        () => (group ? [...group.members].sort((a, b) => b.points - a.points) : []),
        [group]
    );

    const groupAgeDays = group?.createdAt
        ? Math.floor(
              (new Date().getTime() - new Date(group.createdAt).getTime()) / (1000 * 60 * 60 * 24)
          )
        : 0;

    const groupReady = !groupLoading && !!group;
    const statsReady = !statsLoading && !!stats;

    const totalQuestions = stats ? stats.questionsUsedCount + stats.questionsLeftCount : 0;
    const totalRallies = stats ? stats.ralliesCompletedCount + stats.ralliesCreatedCount : 0;

    return (
        <>
            <Header title="Statistics" />

            {/* Overview cards */}
            <div className="grid grid-cols-3 gap-3">
                {groupReady && statsReady ? (
                    <>
                        <StatCard
                            label="days active"
                            value={groupAgeDays}
                            icon={<Calendar className="h-4 w-4" />}
                        />
                        <StatCard
                            label="messages"
                            value={stats!.messagesCount}
                            icon={<MessageSquare className="h-4 w-4" />}
                        />
                        <StatCard
                            label="members"
                            value={group!.members.length}
                            icon={<Trophy className="h-4 w-4" />}
                        />
                    </>
                ) : (
                    [0, 1, 2].map((i) => <Skeleton key={i} className="h-24" />)
                )}
            </div>

            {/* Leaderboard */}
            <SectionHeader>Leaderboard</SectionHeader>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-8">#</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Points</TableHead>
                        <TableHead className="text-right w-16">Streak</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {groupReady
                        ? sortedUsers.map((member: GroupMemberDTO, index: number) => (
                              <TableRow key={String(member.user)}>
                                  <TableCell className="font-medium text-muted-foreground">
                                      {index + 1}
                                  </TableCell>
                                  <TableCell className="font-medium">
                                      <div className="flex items-center gap-2">
                                          <Avatar className="h-7 w-7 shrink-0">
                                              {member.avatarUrl && (
                                                  <AvatarImage
                                                      src={member.avatarUrl}
                                                      alt={member.name}
                                                  />
                                              )}
                                              <AvatarFallback className="text-xs">
                                                  {(member.name || "?").slice(0, 1).toUpperCase()}
                                              </AvatarFallback>
                                          </Avatar>
                                          <span className="truncate">{member.name}</span>
                                      </div>
                                  </TableCell>
                                  <TableCell className="text-right">{member.points}</TableCell>
                                  <TableCell className="text-right">
                                      {member.streak > 0 ? `${member.streak} 👖` : "—"}
                                  </TableCell>
                              </TableRow>
                          ))
                        : [0, 1, 2, 3, 4].map((i) => (
                              <TableRow key={i}>
                                  <TableCell colSpan={4} className="py-2">
                                      <Skeleton className="h-8 w-full" />
                                  </TableCell>
                              </TableRow>
                          ))}
                </TableBody>
            </Table>

            {/* Questions */}
            <SectionHeader>Questions</SectionHeader>
            <div className="grid grid-cols-3 gap-3 mb-4">
                {statsReady ? (
                    <>
                        <StatCard label="used" value={stats!.questionsUsedCount} />
                        <StatCard label="remaining" value={stats!.questionsLeftCount} />
                        <StatCard label="total" value={totalQuestions} />
                    </>
                ) : (
                    [0, 1, 2].map((i) => <Skeleton key={i} className="h-24" />)
                )}
            </div>
            <div className="space-y-3">
                {statsReady ? (
                    <>
                        <QuestionsByType data={stats!.questionsByType} />
                        <QuestionsByUser data={stats!.questionsByUser} />
                    </>
                ) : (
                    <>
                        <Skeleton className="h-64" />
                        <Skeleton className="h-64" />
                    </>
                )}
            </div>

            {/* Rallies */}
            <SectionHeader>Rallies</SectionHeader>
            <div className="grid grid-cols-3 gap-3 mb-4">
                {statsReady ? (
                    <>
                        <StatCard label="completed" value={stats!.ralliesCompletedCount} />
                        <StatCard label="created" value={stats!.ralliesCreatedCount} />
                        <StatCard label="total" value={totalRallies} />
                    </>
                ) : (
                    [0, 1, 2].map((i) => <Skeleton key={i} className="h-24" />)
                )}
            </div>
            {statsReady && stats!.rallyWins?.length > 0 && (
                <Card>
                    <CardContent className="p-4">
                        <div className="text-sm font-medium mb-2">Rally Wins</div>
                        {stats!.rallyWins.map((entry, i) => (
                            <div
                                key={entry.username}
                                className="flex justify-between items-center py-1"
                            >
                                <span className="text-sm">
                                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}{" "}
                                    {entry.username}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    {entry.wins} {entry.wins === 1 ? "win" : "wins"}
                                </span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Jukebox */}
            <SectionHeader>Jukebox</SectionHeader>
            <div className="grid grid-cols-2 gap-3 mb-8">
                {statsReady ? (
                    <>
                        <StatCard
                            label="songs shared"
                            value={stats!.jukeboxSongsCount}
                            icon={<Music className="h-4 w-4" />}
                        />
                        <StatCard
                            label="avg rating"
                            value={stats!.jukeboxAvgRating > 0 ? `${stats!.jukeboxAvgRating}` : "—"}
                            icon={<Star className="h-4 w-4" />}
                        />
                    </>
                ) : (
                    [0, 1].map((i) => <Skeleton key={i} className="h-24" />)
                )}
            </div>
        </>
    );
};

export default StatsPage;
