"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
import Header from "@/components/ui/custom/Header";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import BackLink from "@/components/ui/custom/BackLink";
import { RallyTabs } from "./_components/RallyTabs";
import { EmptyRallyGuide } from "./_components/emptyRallyGuide";
import fetcher from "@/lib/fetcher";
import type { RallyDTO } from "@/types/models/rally";
import { useMemo } from "react";
import type { GroupDTO } from "@/types/models/group";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarkFeatureSeen } from "@/hooks/useMarkFeatureSeen";

const RallyPage = () => {
    const { user } = useAuthRedirect();
    const params = useParams<{ groupId: string }>();
    const groupId = params?.groupId;
    useMarkFeatureSeen(groupId, "rally");

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

    const loading = isLoading || !data;

    return (
        <div className="flex flex-col h-[100dvh]">
            <Header
                leftComponent={<BackLink href={`/groups/${groupId}/dashboard`} />}
                title="Rallies"
            />
            {loading ? (
                <div className="flex flex-col gap-4">
                    <Skeleton className="w-full h-10" />
                    <Skeleton className="w-full h-20" />
                    <Skeleton className="w-full h-96" />
                    <Skeleton className="w-full h-12" />
                </div>
            ) : rallies.length === 0 ? (
                <EmptyRallyGuide
                    groupId={groupId}
                    userIsAdmin={!!userIsAdmin}
                    onActivate={async () => {
                        await fetch(`/api/groups/${groupId}/rally/activate`, {
                            method: "POST",
                        });
                        mutateRallies();
                    }}
                />
            ) : (
                <RallyTabs
                    groupId={groupId}
                    user={user}
                    rallies={rallies}
                    userHasVoted={userHasVoted}
                    userHasUploaded={userHasUploaded}
                    onMutate={() => mutateRallies()}
                />
            )}
        </div>
    );
};

export default RallyPage;
