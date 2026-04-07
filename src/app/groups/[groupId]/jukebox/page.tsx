"use client";

import BackLink from "@/components/ui/custom/BackLink";
import Header from "@/components/ui/custom/Header";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import fetcher from "@/lib/fetcher";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { useToast } from "@/hooks/use-toast";
import type { IJukeboxProcessed } from "@/types/models/jukebox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { JukeboxSearch } from "@/app/groups/[groupId]/jukebox/_components/jukeboxSearch";
import { JukeboxSubmissions } from "@/app/groups/[groupId]/jukebox/_components/jukeboxSubmissions";
import JukeboxLoading from "@/app/groups/[groupId]/jukebox/loading";
import { useMarkFeatureSeen } from "@/hooks/useMarkFeatureSeen";

const JukeboxPage = () => {
    const { user } = useAuthRedirect();
    const params = useParams<{ groupId: string }>();
    const groupId = params ? params.groupId : "";
    useMarkFeatureSeen(groupId, "jukebox");
    const { toast } = useToast();

    // Track active tab (jukebox) and per-jukebox submission status
    const [activeJukeboxId, setActiveJukeboxId] = useState<string | null>(null);
    const [userHasSubmittedMap, setUserHasSubmittedMap] = useState<Record<string, boolean>>({});

    const { data: jukeboxes, isLoading } = useSWR<IJukeboxProcessed[]>(
        user ? `/api/groups/${groupId}/jukebox?isActive=true` : null,
        fetcher
    );

    useEffect(() => {
        if (jukeboxes && jukeboxes.length > 0) {
            // Initialize active tab and userHasSubmitted map from fetched jukeboxes
            setActiveJukeboxId((prev) => prev ?? jukeboxes[0]._id);
            const initMap: Record<string, boolean> = {};
            for (const jukebox of jukeboxes) {
                initMap[jukebox._id] = jukebox.userHasSubmitted;
            }
            setUserHasSubmittedMap(initMap);
        }
    }, [jukeboxes]);

    return (
        <>
            <Header
                leftComponent={<BackLink href={`/groups/${groupId}/dashboard`} />}
                title={`Jukebox`}
            />
            {isLoading || !jukeboxes ? (
                <JukeboxLoading />
            ) : jukeboxes.length === 0 ? (
                <div className="flex items-center justify-center">
                    <Card className="text-center p-6 ">
                        <h2 className="font-bold">Not active</h2>
                    </Card>
                    {/*{userIsAdmin && (*/}
                    {/*    <Button*/}
                    {/*        onClick={() => {*/}
                    {/*            fetch(`/api/groups/${groupId}/rally/activate`, {*/}
                    {/*                method: "POST",*/}
                    {/*            });*/}
                    {/*            router.refresh();*/}
                    {/*        }}*/}
                    {/*    >*/}
                    {/*        Activate Rally*/}
                    {/*    </Button>*/}
                    {/*)}*/}
                </div>
            ) : (
                <>
                    {jukeboxes.length > 1 ? (
                        <Tabs
                            value={activeJukeboxId ?? undefined}
                            onValueChange={setActiveJukeboxId}
                        >
                            <TabsList
                                className="grid w-full mb-4"
                                style={{
                                    gridTemplateColumns: `repeat(${jukeboxes.length}, minmax(0, 1fr))`,
                                }}
                            >
                                {jukeboxes.map((j, index) => {
                                    return (
                                        <TabsTrigger
                                            key={j._id}
                                            value={j._id}
                                            className="flex-shrink-0"
                                        >
                                            {j.title ?? `jukebox ${index + 1}`}
                                        </TabsTrigger>
                                    );
                                })}
                            </TabsList>
                            {jukeboxes.map((j) => {
                                const hasSubmitted =
                                    userHasSubmittedMap[j._id] ?? j.userHasSubmitted;
                                return (
                                    <TabsContent key={j._id} value={j._id} className="mt-4">
                                        {hasSubmitted ? (
                                            <JukeboxSubmissions
                                                jukebox={j}
                                                user={user!}
                                                toast={toast}
                                            />
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
                    ) : (
                        // Only one jukebox – render without tabs
                        <>
                            {(userHasSubmittedMap[jukeboxes[0]._id] ??
                            jukeboxes[0].userHasSubmitted) ? (
                                <JukeboxSubmissions
                                    jukebox={jukeboxes[0]}
                                    user={user!}
                                    toast={toast}
                                />
                            ) : (
                                <JukeboxSearch
                                    jukebox={jukeboxes[0]}
                                    toast={toast}
                                    setUserHasSubmitted={() =>
                                        setUserHasSubmittedMap((prev) => ({
                                            ...prev,
                                            [jukeboxes[0]._id]: true,
                                        }))
                                    }
                                />
                            )}
                        </>
                    )}
                </>
            )}
        </>
    );
};

export default JukeboxPage;
