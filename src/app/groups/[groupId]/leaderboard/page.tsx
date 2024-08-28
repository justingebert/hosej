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

  const sortedUsers = users.sort((a, b) => b.totalPoints - a.totalPoints);

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
          {sortedUsers.map((user) => (
            <TableRow key={user._id}>
              <TableCell className="font-medium">{user.username}</TableCell>
              <TableCell className="text-right">{user.totalPoints}</TableCell>
              <TableCell className="text-right font-medium">
                {user.streak} <span role="img" aria-label="streak">👖</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {error && <p className="text-red-500">{error}</p>}
    </>
  );
};

export default LeaderboardPage;