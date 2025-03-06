"use client";

import React, { Suspense } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import VoteResults from "@/components/Question/VoteResults.client";
import BackLink from "@/components/ui/custom/BackLink";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import Image from "next/image";
import fetcher from "@/lib/fetcher";
import { IQuestion } from "@/types/models/Question";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const ResultsPage = () => {
    const { user } = useAuthRedirect();
    const { groupId, questionId } = useParams<{ groupId: string; questionId: string }>();

    const {
        data: question,
        error,
        isLoading,
    } = useSWR<IQuestion>(questionId ? `/api/groups/${groupId}/question/${questionId}` : null, fetcher);

    if (isLoading) return <Loading />;
    if (error) return <div className="text-red-500">Failed to load question data.</div>;

    return (
        <>
            <BackLink href={`/groups/${groupId}/history`} />
            {question && (
                <div>
                    <h1 className="text-xl font-bold text-center mb-10 mt-10">{question.question}</h1>
                    {question.imageUrl && (
                        <Image
                            src={question.imageUrl}
                            alt={`${question.question}`}
                            className="object-cover w-full h-full cursor-pointer rounded-lg mt-4"
                            width={300}
                            height={300}
                        />
                    )}
                    <div className="flex w-full justify-around my-4">
                        <Badge>🐟{question.rating.bad?.length || 0}</Badge>
                        <Badge>👍{question.rating.ok?.length || 0}</Badge>
                        <Badge>🐐{question.rating.good?.length || 0}</Badge>
                    </div>
                    <div className="flex flex-col items-center mb-10">
                        {question.questionType.startsWith("image") &&
                            question.options &&
                            question.options.map((option: any, index: number) => (
                                <div
                                    key={index}
                                    className="p-4 m-2 bg-primary text-primary-foreground rounded-lg w-full max-w-md"
                                >
                                    <Image
                                        src={option.url}
                                        alt={`Option ${index + 1}`}
                                        className="object-cover w-full h-full rounded-lg"
                                        width={300}
                                        height={300}
                                        priority={index === 0}
                                    />
                                </div>
                            ))}
                        {!question.questionType.startsWith("image") &&
                            question.options &&
                            question.options.map((option: any, index: number) => (
                                <div key={index} className="p-4 m-2 bg-secondary rounded-lg w-full max-w-md">
                                    {option}
                                </div>
                            ))}
                    </div>
                    <VoteResults
                        user={user}
                        question={question}
                        available={false}
                        returnTo={`question/${questionId}/results`}
                    />
                </div>
            )}
        </>
    );
};

const ResultsPageWrapper = () => (
    <Suspense fallback={<Loading />}>
        <ResultsPage />
    </Suspense>
);

const Loading = () => (
    <div className="flex flex-col items-center mt-20">
        <Skeleton className="w-3/4 h-8 mb-6" />
        <div className="flex w-full justify-around mb-6 mt-6">
            <Skeleton className="w-12 h-6 rounded-full" />
            <Skeleton className="w-12 h-6 rounded-full" />
            <Skeleton className="w-12 h-6 rounded-full" />
        </div>
        <Skeleton className="w-full h-40 rounded-lg" />
        <div className="flex flex-col space-y-3 mt-6 w-full max-w-md">
            {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-12" />
            ))}
        </div>
    </div>
);

export default ResultsPageWrapper;
