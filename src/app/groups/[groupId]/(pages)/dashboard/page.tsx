"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Camera, Info, Users, MessageSquareText, Radio, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppHaptics } from "@/hooks/useAppHaptics";
import { ActivityFeature } from "@/types/models/activityEvent";
import { useGroup } from "@/hooks/data/useGroup";
import { useActiveQuestions } from "@/hooks/data/useActiveQuestions";
import { useMissedActivity } from "@/hooks/data/useMissedActivity";

// Lazy load CompletionChart (uses recharts ~200KB)
const CompletionChart = dynamic(
    () =>
        import("@/app/groups/[groupId]/(pages)/dashboard/_components/CompletionChart").then(
            (mod) => ({
                default: mod.CompletionChart,
            })
        ),
    {
        loading: () => <div className="w-24 h-24 bg-muted rounded-lg animate-pulse" />,
        ssr: false,
    }
);

function GroupTitle({ groupId }: { groupId: string }) {
    const { group } = useGroup(groupId);
    if (!group) {
        return (
            <div className="flex-grow flex justify-center px-4">
                <Skeleton className="h-10 w-48" />
            </div>
        );
    }
    const titleClass = group.name && group.name.length > 15 ? "text-2xl" : "text-4xl";
    return (
        <h1
            className={`flex-grow ${titleClass} font-bold text-center tracking-tight break-words px-4`}
        >
            {group.name}
        </h1>
    );
}

function QuestionCard({
    groupId,
    missedCount,
}: {
    groupId: string;
    missedCount: number | undefined;
}) {
    const { play } = useAppHaptics();
    const { completionPercentage, isLoading } = useActiveQuestions(groupId);

    if (isLoading) {
        return <Skeleton className="h-[140px] rounded-2xl w-full" />;
    }

    return (
        <Link
            href={`/groups/${groupId}/question`}
            className="relative group bg-gradient-to-br from-background to-muted/50 border shadow-sm px-6 py-5 min-h-[140px] flex items-center justify-between rounded-2xl cursor-pointer hover:shadow-md active:scale-[0.98] transition-all"
            onClick={() => play("navigation")}
            transitionTypes={["drill-forward"]}
        >
            {missedCount !== undefined && missedCount > 0 && (
                <div className="absolute -top-3 -right-3 z-10">
                    <Badge
                        variant="destructive"
                        className="shadow-sm animate-pulse shadow-destructive/20 border-border"
                    >
                        {missedCount} new
                    </Badge>
                </div>
            )}
            <div className="flex flex-col justify-center gap-1 z-10 relative">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <MessageSquareText className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">
                        Daily Question
                    </span>
                </div>
                <div className="font-bold text-2xl tracking-tight">Answer Today&apos;s</div>
                <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1 group-hover:text-foreground transition-colors">
                    Join the conversation <ChevronRight className="h-4 w-4" />
                </div>
            </div>
            <div className="w-24 h-24 -mr-1 relative flex items-center justify-center shrink-0">
                <CompletionChart completion={completionPercentage ?? 0} />
            </div>
        </Link>
    );
}

export default function Dashboard() {
    const { play } = useAppHaptics();
    const params = useParams<{ groupId: string }>();
    const groupId = params?.groupId ?? "";

    const { missed: missedActivity } = useMissedActivity(groupId || null);

    return (
        <div className="flex flex-col w-full min-h-[calc(100vh-140px)]">
            <div className="flex justify-between items-center mb-8 shrink-0">
                <Link
                    href="/groups"
                    className="inline-flex items-center justify-center rounded-full bg-muted/50 hover:bg-muted h-10 w-10"
                    onClick={() => play("navigation")}
                    transitionTypes={["drill-back"]}
                >
                    <Users className="h-5 w-5" />
                </Link>
                <GroupTitle groupId={groupId} />
                <Link
                    href={`/groups/${groupId}/info`}
                    className="inline-flex items-center justify-center rounded-full bg-muted/50 hover:bg-muted h-10 w-10"
                    onClick={() => play("navigation")}
                    transitionTypes={["drill-forward"]}
                >
                    <Info className="h-5 w-5" />
                </Link>
            </div>

            <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full flex-1 justify-center">
                {/* Questions Section */}
                <QuestionCard
                    groupId={groupId}
                    missedCount={missedActivity?.[ActivityFeature.Question]}
                />

                {/* Rallies Section */}
                <Link
                    href={`/groups/${groupId}/rally`}
                    className="relative group bg-gradient-to-br from-background to-muted/50 border shadow-sm px-6 py-5 min-h-[140px] flex items-center justify-between rounded-2xl cursor-pointer hover:shadow-md active:scale-[0.98] transition-all"
                    onClick={() => play("navigation")}
                    transitionTypes={["drill-forward"]}
                >
                    {missedActivity && missedActivity[ActivityFeature.Rally] > 0 && (
                        <div className="absolute -top-3 -right-3 z-10">
                            <Badge
                                variant="destructive"
                                className="shadow-sm animate-pulse shadow-destructive/20 border-border"
                            >
                                {missedActivity[ActivityFeature.Rally]} new
                            </Badge>
                        </div>
                    )}
                    <div className="flex flex-col justify-center gap-1 z-10 relative">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Camera className="h-4 w-4" />
                            <span className="text-xs font-semibold uppercase tracking-wider">
                                Photo Rallies
                            </span>
                        </div>
                        <div className="font-bold text-2xl tracking-tight">Rally</div>
                        <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1 group-hover:text-foreground transition-colors">
                            View current rally <ChevronRight className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="w-24 h-24 -mr-1 relative flex items-center justify-center shrink-0">
                        <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-300">
                            <Camera className="h-10 w-10" />
                        </div>
                    </div>
                </Link>

                {/* Jukebox Section */}
                <Link
                    href={`/groups/${groupId}/jukebox`}
                    className="relative group bg-gradient-to-br from-background to-muted/50 border shadow-sm px-6 py-5 min-h-[140px] flex items-center justify-between rounded-2xl cursor-pointer hover:shadow-md active:scale-[0.98] transition-all"
                    onClick={() => play("navigation")}
                    transitionTypes={["drill-forward"]}
                >
                    {missedActivity && missedActivity[ActivityFeature.Jukebox] > 0 && (
                        <div className="absolute -top-3 -right-3 z-10">
                            <Badge
                                variant="destructive"
                                className="shadow-sm animate-pulse shadow-destructive/20 border-border"
                            >
                                {missedActivity[ActivityFeature.Jukebox]} new
                            </Badge>
                        </div>
                    )}
                    <div className="flex flex-col justify-center gap-1 z-10 relative">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Radio className="h-4 w-4" />
                            <span className="text-xs font-semibold uppercase tracking-wider">
                                Group Playlist
                            </span>
                        </div>
                        <div className="font-bold text-2xl tracking-tight">Jukebox</div>
                        <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1 group-hover:text-foreground transition-colors">
                            Share and discover music <ChevronRight className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="w-24 h-24 -mr-1 relative flex items-center justify-center shrink-0">
                        <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-300">
                            <Radio className="h-10 w-10" />
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
}
