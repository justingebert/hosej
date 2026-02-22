"use client";

import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    BarChartBig,
    CircleSlash,
    Clock,
    Info,
    MousePointerClick,
    ScanSearch,
    Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import useSWR, { useSWRConfig } from "swr";
import fetcher from "@/lib/fetcher";
import type { GroupDTO } from "@/types/models/group";
import type { IRally } from "@/types/models/rally";
import { Skeleton } from "@/components/ui/skeleton";
import { useHaptic } from "use-haptic";
import type { QuestionWithUserStateDTO } from "@/types/models/question";
import type { FeatureStatus } from "@/types/models/appConfig";

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
    const { mutate } = useSWRConfig();
    const { triggerHaptic } = useHaptic();
    const params = useParams<{ groupId: string }>();
    const groupId = params?.groupId;
    const { data: group, isLoading: groupLoading } = useSWR<GroupDTO>(
        groupId ? `/api/groups/${groupId}` : null,
        fetcher
    );
    const { data: globalFeatures } = useSWR<{
        questions: { status: FeatureStatus };
        rallies: { status: FeatureStatus };
        jukebox: { status: FeatureStatus };
    }>("/api/features/status", fetcher);
    const { data: questionsData, isLoading: questionLoading } = useSWR<{
        questions: QuestionWithUserStateDTO[];
        completionPercentage: number;
    }>(
        globalFeatures?.questions?.status === "enabled" ? `/api/groups/${groupId}/question` : null,
        fetcher
    );
    const { data: ralliesData, isLoading: rallyLoading } = useSWR<{ rallies: IRally[] }>(
        globalFeatures?.rallies?.status === "enabled" ? `/api/groups/${groupId}/rally` : null,
        fetcher
    );

    const questions = questionsData?.questions || [];
    const rallies = ralliesData?.rallies || [];

    const DailyCompletion = questionsData ? questionsData.completionPercentage : 0;

    const titleClass = group?.name && group.name.length > 15 ? "text-2xl" : "text-4xl";

    return (
        <>
            <div className="flex justify-between items-center">
                <Button variant="outline" size="icon" onClick={() => router.push(`/groups`)}>
                    <Users />
                </Button>
                <h1 className={`flex-grow ${titleClass} font-bold text-center break-words`}>
                    {group?.name}
                </h1>
                {/* <Link href={`/groups/${groupId}/settings`}> */}
                <Button variant="outline" size="icon">
                    <Info />
                </Button>
                {/* </Link> */}
            </div>

            <div className="flex flex-col h-[80vh] justify-center">
                <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full">
                    {/* Questions Section */}
                    {globalFeatures?.questions?.status === "comingSoon" ? (
                        <Card className="border-dashed">
                            <CardHeader className="text-center">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Clock className="h-5 w-5" />
                                    <CardTitle>Daily Questions</CardTitle>
                                </div>
                                <Badge variant="secondary" className="mx-auto">
                                    Coming Soon
                                </Badge>
                                <CardDescription className="mt-2">
                                    Daily questions and voting feature is coming soon! Stay tuned.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    ) : (
                        globalFeatures?.questions?.status === "enabled" && (
                            <>
                                {!questionLoading && questionsData ? (
                                    <div
                                        className="relative bg-primary-foreground px-6 py-4 flex items-center justify-between rounded-lg cursor-pointer hover:bg-primary-foreground/80 transition-colors"
                                        onClick={() => {
                                            triggerHaptic();
                                            mutate(`/api/groups/${groupId}/question`);
                                            router.push(`/groups/${groupId}/question`);
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
                                    <Skeleton className="h-32" />
                                )}
                            </>
                        )
                    )}

                    {/* Rallies Section */}
                    {globalFeatures?.rallies?.status === "comingSoon" ? (
                        <Card className="border-dashed">
                            <CardHeader className="text-center">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Clock className="h-5 w-5" />
                                    <CardTitle>Rallies</CardTitle>
                                </div>
                                <Badge variant="secondary" className="mx-auto">
                                    Coming Soon
                                </Badge>
                                <CardDescription className="mt-2">
                                    Photo rally challenges coming soon!
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    ) : (
                        globalFeatures?.rallies?.status === "enabled" && (
                            <>
                                {!rallyLoading && ralliesData ? (
                                    <div
                                        className="relative bg-primary-foreground px-6 py-4 flex items-center justify-between rounded-lg cursor-pointer hover:bg-primary-foreground/80 transition-colors"
                                        onClick={() => {
                                            triggerHaptic();
                                            router.push(`/groups/${groupId}/rally`);
                                        }}
                                    >
                                        {rallies.length > 0 && (
                                            <div className="absolute -top-3 -right-3">
                                                <Badge>{rallies.length}</Badge>
                                            </div>
                                        )}
                                        <div className="flex flex-col justify-center">
                                            <div className="font-bold text-2xl">Rally</div>
                                        </div>
                                        <div className="w-24 h-24 rounded-lg flex items-center justify-center">
                                            {/* Rally icons */}
                                            {rallies.length > 0 && rallies[0].votingOpen && (
                                                <MousePointerClick className="w-full h-full p-4" />
                                            )}
                                            {rallies.length > 0 && rallies[0].resultsShowing && (
                                                <BarChartBig className="w-full h-full p-4" />
                                            )}
                                            {rallies.length > 0 &&
                                                !rallies[0].votingOpen &&
                                                !rallies[0].resultsShowing && (
                                                    <ScanSearch className="w-full h-full p-4" />
                                                )}
                                            {rallies.length === 0 && (
                                                <CircleSlash className="w-full h-full p-4 text-secondary" />
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <Skeleton className="h-32" />
                                )}
                            </>
                        )
                    )}

                    {/* Jukebox Section */}
                    {!groupLoading || group ? (
                        <>
                            {globalFeatures?.jukebox?.status === "comingSoon" ? (
                                <Card className="border-dashed">
                                    <CardHeader className="text-center">
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                            <Clock className="h-5 w-5" />
                                            <CardTitle>Jukebox</CardTitle>
                                        </div>
                                        <Badge variant="secondary" className="mx-auto">
                                            Coming Soon
                                        </Badge>
                                        <CardDescription className="mt-2">
                                            Music submission and rating feature coming soon!
                                        </CardDescription>
                                    </CardHeader>
                                </Card>
                            ) : (
                                globalFeatures?.jukebox?.status === "enabled" &&
                                group?.features?.jukebox?.enabled && (
                                    <div
                                        className="relative bg-primary-foreground px-6 py-4 flex items-center justify-between rounded-lg cursor-pointer hover:bg-primary-foreground/80 transition-colors"
                                        onClick={() => {
                                            triggerHaptic();
                                            router.push(`/groups/${groupId}/jukebox`);
                                        }}
                                    >
                                        <div className="absolute -top-3 -right-3">
                                            <Badge>1</Badge>
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <div className="font-bold text-2xl">Jukebox</div>
                                        </div>
                                        <div className="w-24 h-24 flex items-center justify-center text-6xl">
                                            📻
                                        </div>
                                    </div>
                                )
                            )}
                        </>
                    ) : (
                        <Skeleton className="h-32" />
                    )}
                </div>
            </div>
        </>
    );
}
