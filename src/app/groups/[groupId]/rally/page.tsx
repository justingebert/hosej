"use client";

import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import Header from "@/components/ui/custom/Header";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { Card } from "@/components/ui/card";
import BackLink from "@/components/ui/custom/BackLink";
import { RallyTabs } from "./RallyTabs";
import fetcher from "@/lib/fetcher";
import type { IRallyJson } from "@/types/models/rally";
import { useEffect, useMemo, useState } from "react";
import type { GroupDTO } from "@/types/models/group";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const RallyPage = () => {
    const { user } = useAuthRedirect();
    const params = useParams<{ groupId: string }>();
    const groupId = params?.groupId;
    const router = useRouter();
    const [userHasVoted, setUserHasVoted] = useState<Record<string, boolean>>({});
    const [userHasUploaded, setUserHasUploaded] = useState<Record<string, boolean>>({});

    const { data: group } = useSWR<GroupDTO>(`/api/groups/${groupId}`, fetcher, {});
    const { data, isLoading } = useSWR<{ rallies: IRallyJson[] }>(
        user ? `/api/groups/${groupId}/rally` : null,
        fetcher
    );

    const rallies = useMemo(() => data?.rallies || [], [data?.rallies]);

    const userIsAdmin =
        group && group?.admin && user?._id && group.admin.toString() === user._id.toString();

    // Calculate user vote and upload status based on the fetched data
    useEffect(() => {
        const HasVoted = rallies.reduce((acc: Record<string, boolean>, rally) => {
            const rallyId = rally._id.toString(); // Ensure _id is a string
            acc[rallyId] = rally.submissions.some((submission) =>
                submission.votes.some((vote: any) => vote.user === user._id)
            );
            return acc;
        }, {});
        setUserHasVoted(HasVoted);
        const HasUploaded = rallies.reduce((acc: Record<string, boolean>, rally) => {
            const rallyId = rally._id.toString(); // Ensure _id is a string
            acc[rallyId] = rally.submissions.some(
                (submission) => submission.username === user.username
            );
            return acc;
        }, {});
        setUserHasUploaded(HasUploaded);
    }, [rallies, user]);

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

    if (rallies && rallies.length === 0) {
        return (
            <div className="flex flex-col h-[100dvh]">
                <Header
                    leftComponent={<BackLink href={`/groups/${groupId}/dashboard`} />}
                    title="Rallies"
                />
                <div className="flex flex-grow justify-center items-center">
                    <div className="flex flex-col gap-y-4">
                        <Card className="text-center p-6 ">
                            <h2 className="font-bold">No active rallies</h2>
                        </Card>
                        {userIsAdmin && (
                            <Button
                                onClick={() => {
                                    fetch(`/api/groups/${groupId}/rally/activate`, {
                                        method: "POST",
                                    });
                                    router.refresh();
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
                setUserHasVoted={(newStatus: boolean) => {
                    if (rallies.length > 0) {
                        const rallyId = rallies[0]._id.toString();
                        userHasVoted[rallyId] = newStatus;
                        router.refresh();
                    }
                }}
                setUserHasUploaded={(newStatus: boolean) => {
                    if (rallies.length > 0) {
                        const rallyId = rallies[0]._id.toString();
                        userHasUploaded[rallyId] = newStatus;
                        router.refresh();
                    }
                }}
            />
        </div>
    );
};

export default RallyPage;
