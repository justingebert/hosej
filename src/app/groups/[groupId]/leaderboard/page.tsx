"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Header from "@/components/ui/Header";
import { useParams } from "next/navigation";
import { IGroup } from "@/db/models/Group";

const LeaderboardPage = () => {
  const [members, setMembers] = useState<IGroup["members"]>([]);
  const [error, setError] = useState<string | null>(null);
  const { groupId } = useParams<{ groupId: string }>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/groups/${groupId}/`);
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }
        const data =  await response.json() as IGroup;
        const members =  data.members
        setMembers(members);
      } catch (error: any) {
        setError(error.message);
      }
    };
    fetchData();
  }, [groupId]);

  // Sort users by the points in the specific group
  const sortedUsers = members.sort((a, b) => {
    return b.points - a.points;
  });

  return (
    <>
      <Header href={`/groups/${groupId}/dashboard`} title="Leaderboard" />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Username</TableHead>
            <TableHead className="text-right">Points</TableHead>
            <TableHead className="text-right w-[100px]">Streak</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedUsers.map((member) => {
            return (
              <TableRow key={member.user.toString()}>
                <TableCell className="font-medium">{member.name}</TableCell>
                <TableCell className="text-right">{member.points}</TableCell>
                <TableCell className="text-right font-medium">
                  {member.streak} <span role="img" aria-label="streak">👖</span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {error && <p className="text-red-500">{error}</p>}
    </>
  );
};

export default LeaderboardPage;
