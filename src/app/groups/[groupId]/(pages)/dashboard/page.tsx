"use client";

import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Info, Users, MessageSquareText, Radio, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import type { GroupDTO } from "@/types/models/group";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppHaptics } from "@/hooks/useAppHaptics";
import type { QuestionWithUserStateDTO } from "@/types/models/question";
import { ActivityFeature } from "@/types/models/activityEvent";
import type { MissedActivitySummary } from "@/types/models/activityEvent";

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

export default function Dashboard() {
    const router = useRouter();
    const { play } = useAppHaptics();
    const params = useParams<{ groupId: string }>();
    const groupId = params?.groupId;
    const seenMarkedRef = useRef(false);

    const { data: group } = useSWR<GroupDTO>(groupId ? `/api/groups/${groupId}` : null, fetcher);

    const { data: questionsData, isLoading: questionLoading } = useSWR<{
        questions: QuestionWithUserStateDTO[];
        completionPercentage: number;
    }>(groupId ? `/api/groups/${groupId}/question` : null, fetcher);

    const { data: missedActivity } = useSWR<MissedActivitySummary>(
        groupId ? `/api/groups/${groupId}/activity/missed` : null,
        fetcher
    );

    // Mark dashboard as seen after 2 seconds
    const markSeen = useCallback(() => {
        if (!groupId || seenMarkedRef.current) return;
        seenMarkedRef.current = true;
        fetch(`/api/groups/${groupId}/activity/seen`, { method: "POST" }).catch(() => {
            seenMarkedRef.current = false;
        });
    }, [groupId]);

    useEffect(() => {
        if (!missedActivity) return;
        const timer = setTimeout(markSeen, 2000);
        return () => clearTimeout(timer);
    }, [missedActivity, markSeen]);

    const DailyCompletion = questionsData ? questionsData.completionPercentage : 0;

    const titleClass = group?.name && group.name.length > 15 ? "text-2xl" : "text-4xl";

    const navigateWithHaptics = (path: string) => {
        play("navigation");
        router.push(path);
    };

    return (
        <div className="flex flex-col w-full min-h-[calc(100vh-140px)]">
            <div className="flex justify-between items-center mb-8 shrink-0">
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full bg-muted/50 hover:bg-muted"
                    haptic="navigation"
                    onClick={() => router.push(`/groups`)}
                >
                    <Users className="h-5 w-5" />
                </Button>
                <h1
                    className={`flex-grow ${titleClass} font-bold text-center tracking-tight break-words px-4`}
                >
                    {group?.name}
                </h1>
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full bg-muted/50 hover:bg-muted"
                    haptic="navigation"
                    onClick={() => router.push(`/groups/${groupId}/info`)}
                >
                    <Info className="h-5 w-5" />
                </Button>
            </div>

            <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full flex-1 justify-center">
                {/* Questions Section */}
                {!questionLoading && questionsData ? (
                    <div
                        className="relative group bg-gradient-to-br from-background to-muted/50 border shadow-sm px-6 py-5 min-h-[140px] flex items-center justify-between rounded-2xl cursor-pointer hover:shadow-md active:scale-[0.98] transition-all"
                        onClick={() => navigateWithHaptics(`/groups/${groupId}/question`)}
                    >
                        {missedActivity && missedActivity[ActivityFeature.Question] > 0 && (
                            <div className="absolute -top-3 -right-3 z-10">
                                <Badge
                                    variant="destructive"
                                    className="shadow-sm animate-pulse shadow-destructive/20 border-border"
                                >
                                    {missedActivity[ActivityFeature.Question]} new
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
                            <div className="font-bold text-2xl tracking-tight">
                                Answer Today&apos;s
                            </div>
                            <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1 group-hover:text-foreground transition-colors">
                                Join the conversation <ChevronRight className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="w-24 h-24 -mr-1 relative flex items-center justify-center shrink-0">
                            <CompletionChart completion={DailyCompletion} />
                        </div>
                    </div>
                ) : (
                    <Skeleton className="h-[140px] rounded-2xl w-full" />
                )}

                {/* Rallies Section */}
                <div
                    className="relative group bg-gradient-to-br from-background to-muted/50 border shadow-sm px-6 py-5 min-h-[140px] flex items-center justify-between rounded-2xl cursor-pointer hover:shadow-md active:scale-[0.98] transition-all"
                    onClick={() => navigateWithHaptics(`/groups/${groupId}/rally`)}
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
                </div>

                {/* Jukebox Section */}
                <div
                    className="relative group bg-gradient-to-br from-background to-muted/50 border shadow-sm px-6 py-5 min-h-[140px] flex items-center justify-between rounded-2xl cursor-pointer hover:shadow-md active:scale-[0.98] transition-all"
                    onClick={() => navigateWithHaptics(`/groups/${groupId}/jukebox`)}
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
                </div>
            </div>
        </div>
    );
}
