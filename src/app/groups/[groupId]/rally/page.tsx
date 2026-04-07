"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
import Header from "@/components/ui/custom/Header";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { Card } from "@/components/ui/card";
import BackLink from "@/components/ui/custom/BackLink";
import { RallyTabs } from "./_components/RallyTabs";
import fetcher from "@/lib/fetcher";
import type { RallyDTO } from "@/types/models/rally";
import { useMemo } from "react";
import type { GroupDTO } from "@/types/models/group";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const RallyPage = () => {
    const { user } = useAuthRedirect();
    const params = useParams<{ groupId: string }>();
    const groupId = params?.groupId;

    const { data: group } = useSWR<GroupDTO>(groupId ? `/api/groups/${groupId}` : null, fetcher);
    const {
        data,
        isLoading,
        mutate: mutateRallies,
    } = useSWR<{ rallies: RallyDTO[] }>(
        user && groupId ? `/api/groups/${groupId}/rally` : null,
        fetcher
    );

    const rallies = useMemo(() => data?.rallies || [], [data?.rallies]);

    const userIsAdmin =
        group && group.admin && user?._id && group.admin.toString() === user._id.toString();

    const userHasVoted = useMemo(() => {
        const map: Record<string, boolean> = {};
        for (const rally of rallies) {
            map[rally._id] = rally.submissions.some((sub) =>
                sub.votes.some((vote) => vote.user === user?._id)
            );
        }
        return map;
    }, [rallies, user?._id]);

    const userHasUploaded = useMemo(() => {
        const map: Record<string, boolean> = {};
        for (const rally of rallies) {
            map[rally._id] = rally.submissions.some((sub) => sub.userId === user?._id);
        }
        return map;
    }, [rallies, user?._id]);

    if (isLoading || !data) {
        return (
            <div>
                <Header
                    leftComponent={<BackLink href={`/groups/${groupId}/dashboard`} />}
                    title="Rallies"
                />
                <div>
                    <Skeleton className="w-full h-10 mb-4" />
                    <Skeleton className="w-full h-20 mb-20" />
                    <Skeleton className="w-full h-96 mb-20" />
                    <Skeleton className="w-full h-12 mb-6" />
                </div>
            </div>
        );
    }

    if (rallies.length === 0) {
        return (
            <div className="flex flex-col h-[100dvh]">
                <Header
                    leftComponent={<BackLink href={`/groups/${groupId}/dashboard`} />}
                    title="Rallies"
                />
                <div className="flex flex-grow justify-center items-center">
                    <div className="flex flex-col gap-y-4">
                        <Card className="text-center p-6">
                            <h2 className="font-bold">No active rallies</h2>
                        </Card>
                        {userIsAdmin && (
                            <Button
                                onClick={async () => {
                                    await fetch(`/api/groups/${groupId}/rally/activate`, {
                                        method: "POST",
                                    });
                                    mutateRallies();
                                }}
                            >
                                Activate Rally
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Header
                leftComponent={<BackLink href={`/groups/${groupId}/dashboard`} />}
                title="Rallies"
            />
            <RallyTabs
                groupId={groupId}
                user={user}
                rallies={rallies}
                userHasVoted={userHasVoted}
                userHasUploaded={userHasUploaded}
                onMutate={() => mutateRallies()}
            />
        </div>
    );
};

export default RallyPage;
