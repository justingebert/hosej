"use client";

import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/ui/custom/Header";
import Image from "next/image";
import BackLink from "@/components/ui/custom/BackLink";
import fetcher from "@/lib/fetcher";
import { Skeleton } from "@/components/ui/skeleton";

import type { IResult, QuestionResultsDTO } from "@/types/models/question";

export default function ResultsDetailPage({
    params,
    searchParams,
}: {
    params: { groupId: string; questionId: string };
    searchParams?: { [key: string]: string | string[] | undefined };
}) {
    const { questionId, groupId } = params;
    const { returnTo } = searchParams || {};

    const { data, isLoading } = useSWR<QuestionResultsDTO>(
        `/api/groups/${groupId}/question/${questionId}/results`,
        fetcher
    );

    if (isLoading)
        return (
            <>
                <Header
                    leftComponent={<BackLink href={`/groups/${groupId}/${returnTo}`} />}
                    title={" "}
                />
                {[...Array(10)].map((_, i) => (
                    <Skeleton key={i} className=" h-36 mb-6" />
                ))}
            </>
        );

    //TODO this should never happen -> should redirect back
    if (!data) {
        return null;
    }

    const { results, questionType } = data;

    return (
        <>
            <Header
                leftComponent={<BackLink href={`/groups/${groupId}/${returnTo}`} />}
                title={" "}
            />
            <div className="grid grid-cols-1 gap-5 pb-20">
                {results.map((result: IResult, index: number) => (
                    <Card className="w-full max-w-md mx-auto text-center" key={index}>
                        <CardHeader>
                            <CardTitle>
                                {questionType.startsWith("image") ? (
                                    <Image
                                        src={result.option}
                                        alt={`Response ${index + 1}`}
                                        width={350}
                                        height={150}
                                        className="object-cover rounded-lg mx-auto"
                                        priority={index === 0}
                                    />
                                ) : (
                                    result.option
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2">
                                {result.users.map((username: string, idx: number) => (
                                    <div
                                        key={idx}
                                        className="m-2 p-2 bg-primary rounded-lg text-center text-primary-foreground font-bold"
                                    >
                                        {username}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </>
    );
}
