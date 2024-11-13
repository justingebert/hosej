"use client";

import React from "react";
import useSWR from "swr";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Header from "@/components/ui/custom/Header";
import { useParams } from "next/navigation";
import { IGroup } from "@/db/models/Group";
import fetcher from "@/lib/fetcher";
import { Skeleton } from "@/components/ui/skeleton";

const LeaderboardPage = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { data, isLoading } = useSWR<IGroup>(`/api/groups/${groupId}/`, fetcher);

  const sortedUsers = data?.members.sort((a, b) => b.points - a.points) || [];

  return (
    <>
      <Header title="Leaderboard" />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Username</TableHead>
            <TableHead className="text-right">Points</TableHead>
            <TableHead className="text-right w-[100px]">Streak</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
        {isLoading &&
          [...Array(10)].map((_, i) => (
            <TableRow key={i}>
              <TableCell colSpan={3} className="p-2">
                <Skeleton className="h-10" />
              </TableCell>
          </TableRow>
          ))
        }
          {sortedUsers.map((member) => (
            <TableRow key={member.user.toString()}>
              <TableCell className="font-medium">{member.name}</TableCell>
              <TableCell className="text-right">{member.points}</TableCell>
              <TableCell className="text-right font-medium">
                {member.streak} <span role="img" aria-label="streak">👖</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
};

export default LeaderboardPage;
