"use client";

import { Camera, ThumbsUp, Trophy } from "lucide-react";

const phases = [
    {
        icon: Camera,
        title: "Submit",
        description: "Get a creative task and submit your best photo",
        color: "text-emerald-500 bg-emerald-500/10",
    },
    {
        icon: ThumbsUp,
        title: "Vote",
        description: "Swipe through everyone's submissions and vote",
        color: "text-blue-500 bg-blue-500/10",
    },
    {
        icon: Trophy,
        title: "Results",
        description: "See who won and check the leaderboard",
        color: "text-amber-500 bg-amber-500/10",
    },
];

export function RallyStep() {
    return (
        <div className="flex flex-col gap-4 py-2">
            <div>
                <h2 className="text-lg font-bold mb-1">Photo Rallies</h2>
                <p className="text-sm text-muted-foreground">
                    Compete with your group in photo challenges! Each rally has three phases.
                </p>
            </div>

            <div className="flex flex-col gap-3">
                {phases.map(({ icon: Icon, title, description, color }, i) => (
                    <div key={title} className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                            <div
                                className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${color}`}
                            >
                                <Icon className="h-5 w-5" />
                            </div>
                            {i < phases.length - 1 && (
                                <div className="w-0.5 h-6 bg-muted-foreground/20 mt-1" />
                            )}
                        </div>
                        <div className="pt-1.5">
                            <p className="text-sm font-semibold">{title}</p>
                            <p className="text-xs text-muted-foreground">{description}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="rounded-xl bg-secondary/30 p-4 text-center">
                <div className="flex justify-center gap-3 text-2xl mb-2">
                    <span>🥇</span>
                    <span>🥈</span>
                    <span>🥉</span>
                </div>
                <p className="text-xs text-muted-foreground">
                    Winners earn points for the leaderboard!
                </p>
            </div>
        </div>
    );
}
