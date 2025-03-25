"use client";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BarChartBig, Menu, ScanSearch, MousePointerClick, CircleSlash, Info } from "lucide-react";
import { CompletionChart } from "@/components/Charts/CompletionChart";
import confetti from "canvas-confetti";
import { Badge } from "@/components/ui/badge";
import useSWR, { useSWRConfig } from "swr";
import fetcher from "@/lib/fetcher";
import { Skeleton } from "@/components/ui/skeleton";
import { getGroupResponse, getRalliesResponse } from "@/types/api";

export default function Dashboard() {
    const router = useRouter();
    const { mutate } = useSWRConfig();
    const params = useParams<{ groupId: string }>();
    const groupId = params?.groupId;
    const { data: groupData, isLoading: groupLoading } = useSWR<getGroupResponse>(groupId ? `/api/groups/${groupId}` : null, fetcher);
    const { data: questionsData, isLoading: questionLoading } = useSWR<{
        questions: IQuestion[];
        completionPercentage: number;
    }>(groupId ? `/api/groups/${groupId}/question` : null, fetcher);
    const { data: rallies, isLoading: rallyLoading } = useSWR<getRalliesResponse>(
        groupId ? `/api/groups/${groupId}/rally` : null,
        fetcher
    );

    const questions = questionsData?.questions || [];

    const triggerConfetti = () => {
        const scalar = 2;
        const hose = confetti.shapeFromText({ text: "👖", scalar });
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            shapes: [hose],
            scalar,
        });
    };

    const DailyCompletion = questionsData ? questionsData.completionPercentage : 0;
    if (DailyCompletion === 100) {
        const lastConfetti = localStorage.getItem("confetti");
        if (lastConfetti) {
            const lastConfettiDate = new Date(lastConfetti);
            const now = new Date();
            if (
                now.getDate() === lastConfettiDate.getDate() &&
                now.getMonth() === lastConfettiDate.getMonth() &&
                now.getFullYear() === lastConfettiDate.getFullYear()
            ) {
                return;
            }
            triggerConfetti();
            localStorage.setItem("confetti", new Date().toISOString());
        }
    }

    const titleClass = groupData?.group && groupData.group.name.length > 15 ? "text-2xl" : "text-4xl";

    return (
        <>
            <div className="flex justify-between items-center">
                <Button variant="outline" size="icon" onClick={() => router.push(`/groups`)}>
                    <Menu />
                </Button>
                <h1 className={`flex-grow ${titleClass} font-bold text-center break-words`}>{groupData?.group.name}</h1>
                {/* <Link href={`/groups/${groupId}/settings`}> */}
                <Button variant="outline" size="icon">
                    <Info />
                </Button>
                {/* </Link> */}
            </div>
            
            <div className="flex flex-col h-[80vh] justify-center">
                <div className="grid grid-cols-2 gap-8 items-center">
                    {!questionLoading && questionsData ? (
                        <div
                            className="col-span-2 relative bg-primary-foreground px-6 py-4 flex items-center justify-between rounded-lg"
                            onClick={() => {
                                mutate(`/api/groups/${groupId}/question`);
                                router.push(`/groups/${groupId}/daily`);
                            }}
                        >
                            {questions.length > 0 && (
                                <div className="absolute -top-3 -right-3">
                                    <Badge>{questions.length}</Badge>
                                </div>
                            )}
                            <div className="flex flex-col justify-end">
                                <div className="font-bold text-2xl">Daily</div>
                            </div>
                            <div className="w-24 h-24 rounded-lg">
                                <CompletionChart completion={DailyCompletion} />
                            </div>
                        </div>
                    ) : (
                        <Skeleton className="col-span-2 h-32" />
                    )}

                    {!rallyLoading && rallies ? (
                        <div
                            className="relative bg-primary-foreground px-6 py-4 flex items-center justify-between rounded-lg"
                            onClick={() => router.push(`/groups/${groupId}/rally`)}
                        >
                            {rallies.length > 0 && (
                                <div className="absolute -top-3 -right-3">
                                    <Badge>{rallies.length}</Badge>
                                </div>
                            )}
                            <div className="flex flex-col justify-center">
                                <div className="w-24 h-24 rounded-lg flex items-center justify-center">
                                    {/* Rally icons */}
                                    {rallies.length > 0 && rallies[0].votingOpen && (
                                        <MousePointerClick className="w-full h-full p-4" />
                                    )}
                                    {rallies.length > 0 && rallies[0].resultsShowing && (
                                        <BarChartBig className="w-full h-full p-4" />
                                    )}
                                    {rallies.length > 0 && !rallies[0].votingOpen && !rallies[0].resultsShowing && (
                                        <ScanSearch className="w-full h-full p-4" />
                                    )}
                                    {rallies.length === 0 && (
                                        <CircleSlash className="w-full h-full p-4 text-secondary" />
                                    )}
                                </div>
                                <div className="font-bold text-2xl">Rally</div>
                            </div>
                        </div>
                    ) : (
                        <Skeleton className="h-40" />
                    )}

                    {!groupLoading || groupData ? (
                        <>
                            {groupData?.group.jukebox && (
                                <div
                                    className="relative bg-primary-foreground px-6 py-4 flex items-center justify-between rounded-lg"
                                    onClick={() => router.push(`/groups/${groupId}/jukebox`)}
                                >
                                    <div className="absolute -top-3 -right-3">
                                        <Badge>1</Badge>
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <div className="w-24 h-24 flex items-center justify-center text-6xl">📻</div>
                                        <div className="font-bold text-2xl">Jukebox</div>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <Skeleton className="h-40" />
                    )}
                </div>
            </div>
        </>
    );
}
