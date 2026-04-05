"use client";

import { useParams } from "next/navigation";
import Header from "@/components/ui/custom/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquareText, Radio, Camera, Trophy, Plus, History } from "lucide-react";

const features = [
    {
        icon: MessageSquareText,
        title: "Daily Questions",
        description:
            "Every day your group gets new questions to answer. Vote on options, write text responses, or match pairings. After voting, see how everyone answered and discuss in the chat.",
    },
    {
        icon: Camera,
        title: "Photo Rallies",
        description:
            "Photo challenges for your group. Everyone submits a photo for the prompt, then you all vote on your favorites. The best photo wins points!",
    },
    {
        icon: Radio,
        title: "Jukebox",
        description:
            "Share music with your group. Search for songs on Spotify, submit your pick, and rate what others shared. Discover new music together.",
    },
    {
        icon: Trophy,
        title: "Leaderboard & Stats",
        description:
            "Track who's the most active, see group statistics, and compete for the top spot. Points are earned by participating in questions, rallies, and the jukebox.",
    },
    {
        icon: Plus,
        title: "Create Content",
        description:
            "Admins and members can create custom questions and rally prompts for the group. Choose from different question types: multiple choice, text, image, or pairing.",
    },
    {
        icon: History,
        title: "History",
        description:
            "Browse past questions and see how the group answered. Filter and search through your group's question history.",
    },
];

export default function GroupInfoPage() {
    const params = useParams<{ groupId: string }>();
    const groupId = params?.groupId;

    return (
        <>
            <Header title="How It Works" href={`/groups/${groupId}/dashboard`} />

            <div className="space-y-4 pb-8">
                {features.map((feature) => (
                    <Card key={feature.title}>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-3 text-lg">
                                <feature.icon className="h-5 w-5 text-muted-foreground shrink-0" />
                                {feature.title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {feature.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </>
    );
}
