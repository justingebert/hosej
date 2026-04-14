"use client";

import { MessageSquareText, Camera, Radio, MessageCircle } from "lucide-react";

const features = [
    { icon: MessageSquareText, label: "Daily Questions", color: "text-blue-500" },
    { icon: Camera, label: "Photo Rallies", color: "text-emerald-500" },
    { icon: Radio, label: "Group Jukebox", color: "text-amber-500" },
    { icon: MessageCircle, label: "Chat", color: "text-violet-500" },
];

export function WelcomeStep() {
    return (
        <div className="flex flex-col items-center text-center gap-6 py-4">
            <div>
                <h2 className="text-2xl font-bold mb-2">Welcome to HoseJ</h2>
                <p className="text-muted-foreground text-sm">
                    Daily questions, photo rallies, music sharing — all with your friend group.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
                {features.map(({ icon: Icon, label, color }) => (
                    <div
                        key={label}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary/50"
                    >
                        <Icon className={`h-8 w-8 ${color}`} />
                        <span className="text-xs font-medium">{label}</span>
                    </div>
                ))}
            </div>

            <p className="text-xs text-muted-foreground">
                Let&apos;s walk through how everything works!
            </p>
        </div>
    );
}
