"use client";

import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import Header from "@/components/ui/custom/Header";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { Card } from "@/components/ui/card";
import BackLink from "@/components/ui/custom/BackLink";
import { RallyTabs } from "./RallyTabs";
import fetcher from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getGroupResponse, getRalliesResponse } from "@/types/api";

const RallyPage = () => {
    const { user } = useAuthRedirect();
    const { groupId } = useParams<{ groupId: string }>();
    const router = useRouter();

    const { data: rallies, isLoading } = useSWR<getRalliesResponse>(
        user ? `/api/groups/${groupId}/rally` : null,
        fetcher
    );

    if (isLoading) {
        return (
            <div>
                <Header leftComponent={<BackLink href={`/groups/${groupId}/dashboard`} />} title="Rallies" />
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
                <Header leftComponent={<BackLink href={`/groups/${groupId}/dashboard`} />} title="Rallies" />
                <div className="flex flex-grow justify-center items-center">
                    <div className="flex flex-col gap-y-4">
                        <Card className="text-center p-6 ">
                            <h2 className="font-bold">No active rallies</h2>
                        </Card>
                        {/* {userIsAdmin && (
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
                        )} */}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Header leftComponent={<BackLink href={`/groups/${groupId}/dashboard`} />} title="Rallies" />
            <RallyTabs groupId={groupId} user={user} rallies={rallies} />
        </div>
    );
};

export default RallyPage;
