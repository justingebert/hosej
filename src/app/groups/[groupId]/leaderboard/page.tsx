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
import { IUser } from "@/db/models/user";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";

// Fetch users for a specific group
const fetchUsers = async (groupId: string) => {
  const response = await fetch(`/api/${groupId}/users`);
  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }
  return response.json();
};

const LeaderboardPage = () => {
  const { session, status, user } = useAuthRedirect();
  const [users, setUsers] = useState<IUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { groupId } = useParams<{ groupId: string }>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const users = await fetchUsers(groupId);
        setUsers(users);
      } catch (error: any) {
        setError(error.message);
      }
    };
    fetchData();
  }, [groupId]);

  // Extract points and streak for the specific group
  const getGroupData = (user: IUser, groupId: string) => {
    const groupData = user.groups.find(
      (group) => group.group.toString() === groupId
    );
    return groupData ? { points: groupData.points, streak: groupData.streak } : { points: 0, streak: 0 };
  };

  // Sort users by the points in the specific group
  const sortedUsers = users.sort((a, b) => {
    const aGroupData = getGroupData(a, groupId);
    const bGroupData = getGroupData(b, groupId);
    return bGroupData.points - aGroupData.points;
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
          {sortedUsers.map((user) => {
            const { points, streak } = getGroupData(user, groupId);
            return (
              <TableRow key={user._id}>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell className="text-right">{points}</TableCell>
                <TableCell className="text-right font-medium">
                  {streak} <span role="img" aria-label="streak">👖</span>
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
