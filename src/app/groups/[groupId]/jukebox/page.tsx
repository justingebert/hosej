"use client";

import BackLink from "@/components/ui/custom/BackLink";
import Header from "@/components/ui/custom/Header";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { JukeboxSearch } from "@/app/groups/[groupId]/jukebox/_components/jukeboxSearch";
import { JukeboxSubmissions } from "@/app/groups/[groupId]/jukebox/_components/jukeboxSubmissions";
import { useMarkFeatureSeen } from "@/hooks/useMarkFeatureSeen";
import type { Session } from "next-auth";
import { useJukeboxes } from "@/hooks/data/useJukeboxes";

function JukeboxBodySkeleton() {
    return (
        <div className="space-y-3">
            {[...Array(8)].map((_, index) => (
                <div key={index} className="flex items-center gap-4 p-3">
                    <Skeleton className="w-16 h-16 rounded-md shrink-0" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function JukeboxBody({ user, groupId }: { user: Session["user"]; groupId: string }) {
    const { toast } = useToast();
    const { jukeboxes, isLoading } = useJukeboxes(groupId);

    const [selectedJukeboxId, setSelectedJukeboxId] = useState<string | null>(null);
    const [userHasSubmittedMap, setUserHasSubmittedMap] = useState<Record<string, boolean>>({});
    const [syncedSubmissionKey, setSyncedSubmissionKey] = useState<string | null>(null);

    const nextSubmissionKey =
        jukeboxes.length > 0
            ? JSON.stringify(jukeboxes.map((jukebox) => [jukebox._id, jukebox.userHasSubmitted]))
            : null;

    if (nextSubmissionKey !== syncedSubmissionKey) {
        const nextMap: Record<string, boolean> = {};
        for (const jukebox of jukeboxes) {
            nextMap[jukebox._id] = jukebox.userHasSubmitted;
        }
        setUserHasSubmittedMap(nextMap);
        setSyncedSubmissionKey(nextSubmissionKey);
    }

    if (isLoading) return <JukeboxBodySkeleton />;

    if (jukeboxes.length === 0) {
        return (
            <div className="flex items-center justify-center">
                <Card className="text-center p-6 ">
                    <h2 className="font-bold">Not active</h2>
                </Card>
            </div>
        );
    }

    const activeJukeboxId =
        selectedJukeboxId && jukeboxes.some((jukebox) => jukebox._id === selectedJukeboxId)
            ? selectedJukeboxId
            : jukeboxes[0]._id;

    if (jukeboxes.length > 1) {
        return (
            <Tabs value={activeJukeboxId} onValueChange={setSelectedJukeboxId}>
                <TabsList
                    className="grid w-full mb-4"
                    style={{
                        gridTemplateColumns: `repeat(${jukeboxes.length}, minmax(0, 1fr))`,
                    }}
                >
                    {jukeboxes.map((j, index) => (
                        <TabsTrigger key={j._id} value={j._id} className="flex-shrink-0">
                            {j.title ?? `jukebox ${index + 1}`}
                        </TabsTrigger>
                    ))}
                </TabsList>
                {jukeboxes.map((j) => {
                    const hasSubmitted = userHasSubmittedMap[j._id] ?? j.userHasSubmitted;
                    return (
                        <TabsContent key={j._id} value={j._id} className="mt-4">
                            {hasSubmitted ? (
                                <JukeboxSubmissions jukebox={j} user={user} toast={toast} />
                            ) : (
                                <JukeboxSearch
                                    jukebox={j}
                                    toast={toast}
                                    setUserHasSubmitted={() =>
                                        setUserHasSubmittedMap((prev) => ({
                                            ...prev,
                                            [j._id]: true,
                                        }))
                                    }
                                />
                            )}
                        </TabsContent>
                    );
                })}
            </Tabs>
        );
    }

    // Single jukebox
    const single = jukeboxes[0];
    const hasSubmitted = userHasSubmittedMap[single._id] ?? single.userHasSubmitted;
    return hasSubmitted ? (
        <JukeboxSubmissions jukebox={single} user={user} toast={toast} />
    ) : (
        <JukeboxSearch
            jukebox={single}
            toast={toast}
            setUserHasSubmitted={() =>
                setUserHasSubmittedMap((prev) => ({ ...prev, [single._id]: true }))
            }
        />
    );
}

const JukeboxPage = () => {
    const { user } = useAuthRedirect();
    const params = useParams<{ groupId: string }>();
    const groupId = params ? params.groupId : "";
    useMarkFeatureSeen(groupId, "jukebox");

    return (
        <>
            <Header
                leftComponent={<BackLink href={`/groups/${groupId}/dashboard`} />}
                title={`Jukebox`}
            />
            {user ? <JukeboxBody user={user} groupId={groupId} /> : <JukeboxBodySkeleton />}
        </>
    );
};

export default JukeboxPage;
