"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type PointsEntry = {
  points: number;
  date: Date;
};

type User = {
  _id: string;
  username: string;
  points: PointsEntry[];
  streak: number;
};

const fetchUsers = async () => {
  const response = await fetch('/api/users');
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  return response.json();
};

const getCurrentPoints = (points: PointsEntry[]) => points.length > 0 ? points[points.length - 1].points : 0;

const LeaderboardPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const users = await fetchUsers();
        setUsers(users);
      } catch (error: any) {
        setError(error.message);
      }
    };
    fetchData();
  }, []);

  const sortedUsers = users.sort((a, b) => getCurrentPoints(b.points) - getCurrentPoints(a.points));

  return (
    <div className="m-6">
      <Table>
        <TableCaption>Leaderboard</TableCaption>
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
              <TableCell className="text-right">{getCurrentPoints(user.points)}</TableCell>
              <TableCell className="text-right font-medium">
                {user.streak} <span role="img" aria-label="pants">👖</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
};

export default LeaderboardPage;
