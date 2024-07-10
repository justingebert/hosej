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

type User = {
  _id: string;
  username: string;
  points: number[];
};

const fetchUsers = async () => {
  const response = await fetch('/api/users');
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  return response.json();
};

const getCurrentPoints = (points: number[]) => points[points.length - 1] || 0;

const LeaderboardPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const users = await fetchUsers();
        setUsers(users);
      } catch (error:any) {
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
            <TableHead>Total Points</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedUsers.map((user) => (
            <TableRow key={user._id}>
              <TableCell className="font-medium">{user.username}</TableCell>
              <TableCell>{getCurrentPoints(user.points)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
};

export default LeaderboardPage;
