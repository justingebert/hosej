"use client";

import { useParams } from "next/navigation";
import Header from "@/components/ui/custom/Header";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { Card } from "@/components/ui/card";
import BackLink from "@/components/ui/custom/BackLink";
import { RallyTabs } from "./_components/RallyTabs";
import { useMemo } from "react";
import type { Session } from "next-auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarkFeatureSeen } from "@/hooks/useMarkFeatureSeen";
import { useGroup } from "@/hooks/data/useGroup";
import { useGroupRallies } from "@/hooks/data/useGroupRallies";

function RallyBodySkeleton() {
    return (
        <div>
            <Skeleton className="w-full h-10 mb-4" />
            <Skeleton className="w-full h-20 mb-20" />
            <Skeleton className="w-full h-96 mb-20" />
            <Skeleton className="w-full h-12 mb-6" />
        </div>
    );
}

function RallyBody({ user, groupId }: { user: Session["user"]; groupId: string }) {
    const { group, isLoading: groupLoading } = useGroup(groupId);
    const {
        rallies,
        isLoading: ralliesLoading,
        mutate: mutateRallies,
        activateRally,
    } = useGroupRallies(groupId);

    const userIsAdmin = group?.userIsAdmin ?? false;

    const userHasVoted = useMemo(() => {
        const map: Record<string, boolean> = {};
        for (const rally of rallies) {
            map[rally._id] = rally.submissions.some((sub) =>
                sub.votes.some((vote) => vote.user === user._id)
            );
        }
        return map;
    }, [rallies, user._id]);

    const userHasUploaded = useMemo(() => {
        const map: Record<string, boolean> = {};
        for (const rally of rallies) {
            map[rally._id] = rally.submissions.some((sub) => sub.userId === user._id);
        }
        return map;
    }, [rallies, user._id]);

    if (groupLoading || ralliesLoading) return <RallyBodySkeleton />;

    if (rallies.length === 0) {
        return (
            <div className="flex flex-grow justify-center items-center">
                <div className="flex flex-col gap-y-4">
                    <Card className="text-center p-6">
                        <h2 className="font-bold">No active rallies</h2>
                    </Card>
                    {userIsAdmin && (
                        <Button onClick={() => void activateRally()}>Activate Rally</Button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <RallyTabs
            groupId={groupId}
            user={user}
            rallies={rallies}
            userHasVoted={userHasVoted}
            userHasUploaded={userHasUploaded}
            onMutate={() => mutateRallies()}
        />
    );
}

const RallyPage = () => {
    const { user } = useAuthRedirect();
    const params = useParams<{ groupId: string }>();
    const groupId = params?.groupId ?? "";
    useMarkFeatureSeen(groupId, "rally");

    return (
        <div>
            <Header
                leftComponent={<BackLink href={`/groups/${groupId}/dashboard`} />}
                title="Rallies"
            />
            {user && groupId ? <RallyBody user={user} groupId={groupId} /> : <RallyBodySkeleton />}
        </div>
    );
};

export default RallyPage;
