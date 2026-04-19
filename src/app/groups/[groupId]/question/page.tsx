"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/ui/custom/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import BackLink from "@/components/ui/custom/BackLink";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import QuestionsTabs from "./_components/QuestionTabs";
import { EmptyQuestionGuide } from "./_components/emptyQuestionGuide";
import type { GroupDTO } from "@/types/models/group";

import type { QuestionWithUserStateDTO } from "@/types/models/question";
import { useMarkFeatureSeen } from "@/hooks/useMarkFeatureSeen";

const DailyQuestionPage = () => {
    const { user } = useAuthRedirect();
    const params = useParams<{ groupId: string }>();
    const groupId = params ? params.groupId : "";
    useMarkFeatureSeen(groupId, "question");
    const router = useRouter();

    const { data: group } = useSWR<GroupDTO>(groupId ? `/api/groups/${groupId}` : null, fetcher);
    const userIsAdmin =
        group && group.admin && user?._id && group.admin.toString() === user._id.toString();

    const {
        data,
        isLoading,
        mutate: mutateQuestions,
    } = useSWR<{ questions: QuestionWithUserStateDTO[] }>(
        user ? `/api/groups/${groupId}/question` : null,
        fetcher
    );

    return (
        <div className="flex flex-col h-[100dvh]">
            <Header
                leftComponent={<BackLink href={`/groups/${groupId}/dashboard`} />}
                title="Daily Questions"
            />

            {isLoading || !data ? (
                <div className="flex flex-col gap-4">
                    <Skeleton className="w-full h-10" />
                    <Skeleton className="w-full h-[300px]" />
                </div>
            ) : data.questions && data.questions.length > 0 ? (
                <QuestionsTabs user={user!} groupId={groupId} questions={data.questions} />
            ) : (
                <EmptyQuestionGuide
                    groupId={groupId}
                    userIsAdmin={!!userIsAdmin}
                    onActivate={async () => {
                        await fetch(`/api/groups/${groupId}/question/activate`, {
                            method: "POST",
                        });
                        mutateQuestions();
                    }}
                />
            )}
        </div>
    );
};

export default DailyQuestionPage;
