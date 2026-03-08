"use client";

import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Clock, Info, Users, MessageSquareText, Radio, ChevronRight } from "lucide-react";
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
        import("@/components/features/charts/CompletionChart").then((mod) => ({
            default: mod.CompletionChart,
        })),
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

                {/* Rallies Section — Coming Soon (uncomment when ready) */}
                <div className="relative bg-muted/30 border border-dashed border-muted-foreground/30 px-6 py-5 min-h-[140px] flex flex-col items-center justify-center rounded-2xl opacity-80">
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-bold text-xl tracking-tight text-muted-foreground">
                            Rallies
                        </h3>
                    </div>
                    <Badge variant="secondary" className="mb-2">
                        Coming Soon
                    </Badge>
                    <p className="text-sm text-muted-foreground text-center">
                        Photo rally challenges coming soon!
                    </p>
                </div>

                {/* TODO: Uncomment when rallies are ready
                {!rallyLoading && ralliesData ? (
                    <div
                        className="relative group bg-gradient-to-br from-background to-muted/50 border shadow-sm px-6 py-5 min-h-[140px] flex items-center justify-between rounded-2xl cursor-pointer hover:shadow-md active:scale-[0.98] transition-all"
                        onClick={() =>
                            navigateWithHaptics(`/groups/${groupId}/rally`)
                        }
                    >
                        {missedActivity &&
                            missedActivity[ActivityFeature.Rally] > 0 && (
                                <div className="absolute -top-3 -right-3 z-10">
                                    <Badge variant="destructive" className="shadow-sm animate-pulse shadow-destructive/20 border-border">
                                        {missedActivity[ActivityFeature.Rally]} new
                                    </Badge>
                                </div>
                            )}
                        <div className="flex flex-col justify-center gap-1">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Camera className="h-4 w-4" />
                                <span className="text-xs font-semibold uppercase tracking-wider">Photo Rallies</span>
                            </div>
                            <div className="font-bold text-2xl tracking-tight">Rally</div>
                            <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1 group-hover:text-foreground transition-colors">
                                View current rally <ChevronRight className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="w-24 h-24 -mr-1 relative flex items-center justify-center shrink-0">
                            <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-300">
                                {rallies.length > 0 && rallies[0].votingOpen && (
                                    <MousePointerClick className="w-8 h-8" />
                                )}
                                {rallies.length > 0 && rallies[0].resultsShowing && (
                                    <BarChartBig className="w-8 h-8" />
                                )}
                                {rallies.length > 0 &&
                                    !rallies[0].votingOpen &&
                                    !rallies[0].resultsShowing && (
                                        <ScanSearch className="w-8 h-8" />
                                    )}
                                {rallies.length === 0 && (
                                    <CircleSlash className="w-8 h-8 text-secondary" />
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <Skeleton className="h-[140px] rounded-2xl w-full" />
                )}
                */}

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
