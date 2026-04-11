"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/ui/custom/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import BackLink from "@/components/ui/custom/BackLink";
import QuestionsTabs from "./QuestionTabs";
import type { Session } from "next-auth";
import { useMarkFeatureSeen } from "@/hooks/useMarkFeatureSeen";
import { useActiveQuestions } from "@/hooks/data/useActiveQuestions";

function QuestionsBodySkeleton() {
    return (
        <div className="flex flex-col">
            <Skeleton className="w-full h-10 mb-6" />
            <Skeleton className="w-full h-20 mb-6" />
            <Skeleton className="w-full h-[300px] mb-6" />
            <Skeleton className="w-full h-[300px] mb-6" />
        </div>
    );
}

function QuestionsBody({ user, groupId }: { user: Session["user"]; groupId: string }) {
    const router = useRouter();
    const { questions, isLoading } = useActiveQuestions(groupId);

    if (isLoading) return <QuestionsBodySkeleton />;

    if (questions && questions.length > 0) {
        return <QuestionsTabs user={user} groupId={groupId} questions={questions} />;
    }

    return (
        <div className="flex flex-grow justify-center items-center">
            <Card className="w-full">
                <CardContent className="flex flex-col justify-center">
                    <h2 className="font-bold p-6 text-center text-xl text-nowrap">
                        {"No questions available :("}
                    </h2>
                    <Button onClick={() => router.push(`/groups/${groupId}/create`)}>
                        Create Questions
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

const DailyQuestionPage = () => {
    const { user } = useAuthRedirect();
    const params = useParams<{ groupId: string }>();
    const groupId = params ? params.groupId : "";
    useMarkFeatureSeen(groupId, "question");

    return (
        <div className="flex flex-col h-[100dvh]">
            <Header
                leftComponent={<BackLink href={`/groups/${groupId}/dashboard`} />}
                title="Daily Questions"
            />

            {user ? <QuestionsBody user={user} groupId={groupId} /> : <QuestionsBodySkeleton />}
        </div>
    );
};

export default DailyQuestionPage;
