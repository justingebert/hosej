"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, MessageSquare, Trophy } from "lucide-react";

const mockLeaderboard = [
    { rank: 1, name: "Alex", points: 420, streak: 90 },
    { rank: 2, name: "Sam", points: 380, streak: 59 },
    { rank: 3, name: "You", points: 350, streak: 200 },
];

const mockStats = [
    { label: "days active", value: "42", icon: <Calendar className="h-4 w-4" /> },
    { label: "messages", value: "1.2k", icon: <MessageSquare className="h-4 w-4" /> },
    { label: "members", value: "6", icon: <Trophy className="h-4 w-4" /> },
];

export function HistoryStatsStep() {
    return (
        <div className="flex flex-col gap-4 py-2">
            <div>
                <h2 className="text-lg font-bold mb-1">History & Stats</h2>
                <p className="text-sm text-muted-foreground">
                    Browse past questions and track your group&apos;s activity over time.
                </p>
            </div>

            {/* Mini stat cards */}
            <div className="grid grid-cols-3 gap-2">
                {mockStats.map((stat) => (
                    <Card key={stat.label}>
                        <CardContent className="flex flex-col items-center justify-center p-3">
                            <div className="text-muted-foreground mb-1">{stat.icon}</div>
                            <div className="text-lg font-bold">{stat.value}</div>
                            <div className="text-[10px] text-muted-foreground">{stat.label}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Mini leaderboard */}
            <div className="rounded-xl bg-secondary/30 p-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">Leaderboard</p>
                <div className="flex flex-col gap-2">
                    {mockLeaderboard.map((entry) => (
                        <div key={entry.rank} className="flex items-center gap-2">
                            <span className="text-sm w-6 text-center">
                                {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : "🥉"}
                            </span>
                            <Avatar className="h-6 w-6 shrink-0">
                                <AvatarFallback className="text-[10px]">
                                    {entry.name[0]}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-sm flex-1">{entry.name}</span>
                            <span className="text-xs flex-1 text-muted-foreground">
                                {entry.points} pts
                            </span>
                            <span className="text-xs text-muted-foreground">{entry.streak} 👖</span>
                        </div>
                    ))}
                </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
                <span className="font-semibold text-foreground">Points</span> are earned by{" "}
                <span className="font-semibold text-foreground">
                    voting, creating, submitting, and participating daily
                </span>
                . Keep your streak going!
            </p>
        </div>
    );
}
