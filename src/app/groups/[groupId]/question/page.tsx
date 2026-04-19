"use client";

import React from "react";
import { useParams } from "next/navigation";
import Header from "@/components/ui/custom/Header";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import BackLink from "@/components/ui/custom/BackLink";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import QuestionsTabs from "./_components/QuestionTabs";
import { EmptyQuestionGuide } from "./_components/emptyQuestionGuide";

import type { QuestionWithUserStateDTO } from "@/types/models/question";
import { useMarkFeatureSeen } from "@/hooks/useMarkFeatureSeen";
import { useToast } from "@/hooks/use-toast";

const DailyQuestionPage = () => {
    const { user } = useAuthRedirect();
    const params = useParams<{ groupId: string }>();
    const groupId = params ? params.groupId : "";
    useMarkFeatureSeen(groupId, "question");
    const { toast } = useToast();

    const {
        data,
        isLoading,
        mutate: mutateQuestions,
    } = useSWR<{ questions: QuestionWithUserStateDTO[] }>(
        user ? `/api/groups/${groupId}/question` : null,
        fetcher
    );

    const handleActivate = async () => {
        try {
            const res = await fetch(`/api/groups/${groupId}/question/activate`, {
                method: "POST",
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body?.message || "Failed to activate next question");
            }
            const body = (await res.json().catch(() => ({}))) as { activated?: number };
            if (body.activated === 0) {
                toast({
                    title: "No questions available",
                    description: "Create a question or add a pack first.",
                    variant: "destructive",
                });
                return;
            }
            mutateQuestions();
        } catch (err) {
            toast({
                title: "Activation failed",
                description: err instanceof Error ? err.message : "Please try again.",
                variant: "destructive",
            });
        }
    };

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
                <EmptyQuestionGuide groupId={groupId} onActivate={handleActivate} />
            )}
        </div>
    );
};

export default DailyQuestionPage;
