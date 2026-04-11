"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import Image from "next/image";
import type { Session } from "next-auth";
import { useAppHaptics } from "@/hooks/useAppHaptics";
import { useQuestionResults } from "@/hooks/data/useQuestionDetails";

import type { IPairingResult, IResult, QuestionDTO } from "@/types/models/question";
import { Badge } from "@/components/ui/badge";
import ChatComponent from "@/components/common/Chat";
import { Skeleton } from "@/components/ui/skeleton";

type VoteResultsProps = {
    user: Session["user"];
    question: QuestionDTO;
    available: boolean;
    returnTo?: string;
};

const VoteResults = ({ user, question, available, returnTo }: VoteResultsProps) => {
    const [animationTriggered, setAnimationTriggered] = useState(false);
    const { play } = useAppHaptics();
    const { results: data, error } = useQuestionResults(question.groupId, question._id);

    useEffect(() => {
        if (data) setAnimationTriggered(true);
    }, [data]);

    if (error) return <div className="text-red-500">Failed to load results</div>;
    if (!data)
        return (
            <div className="flex justify-center">
                <Skeleton className="w-full h-40 " />
            </div>
        );

    const results = data.results;
    const pairingResults = data.pairingResults;
    const isPairing = data.questionType === "pairing";
    const isImage = data.questionType === "image";
    const numOfVotes = `${data.totalVotes} of ${data.totalUsers} voted`;

    return (
        <div>
            <div className="flex justify-center">{numOfVotes}</div>
            {isPairing && pairingResults ? (
                <div className="space-y-2 my-2">
                    {pairingResults.map((pr: IPairingResult) => {
                        const topCount = pr.valueCounts[0]?.count ?? 0;
                        const topValues = pr.valueCounts.filter((vc) => vc.count === topCount);

                        return (
                            <Link
                                key={pr.key}
                                href={`/groups/${question.groupId}/question/${question._id}/resultsdetailed/?returnTo=${encodeURIComponent(returnTo || "")}`}
                                onClick={() => play("selection")}
                            >
                                <div className="bg-secondary my-2 rounded-md p-3 flex justify-between items-center gap-2 min-w-0">
                                    <span className="font-medium truncate shrink-0 max-w-[40%]">
                                        {pr.key}
                                    </span>
                                    <div className="flex gap-1 flex-wrap justify-end min-w-0 max-w-[60%]">
                                        {topValues.length === 0 ? (
                                            <Badge variant="outline">-</Badge>
                                        ) : topValues.length === 1 ? (
                                            <Badge className="truncate max-w-full">
                                                {topValues[0].value}
                                            </Badge>
                                        ) : (
                                            topValues.map((tv) => (
                                                <Badge
                                                    key={tv.value}
                                                    variant="outline"
                                                    className="truncate max-w-full"
                                                >
                                                    {tv.value}
                                                </Badge>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <div>
                    {results.map((result: IResult, index: number) => (
                        <Link
                            key={index}
                            href={`/groups/${question.groupId}/question/${question._id}/resultsdetailed/?returnTo=${encodeURIComponent(returnTo || "")}`}
                            onClick={() => play("selection")}
                        >
                            <div className="bg-secondary my-2 rounded-md relative">
                                <motion.div
                                    className="bg-secondarydark h-12 rounded"
                                    initial={{ width: 0 }}
                                    animate={{
                                        width: animationTriggered ? `${result.percentage}%` : "0%",
                                    }}
                                    transition={{ duration: 1, ease: "easeInOut" }}
                                ></motion.div>
                                <div className="absolute inset-0 flex justify-between px-2 items-center">
                                    {isImage ? (
                                        <Image
                                            src={result.option}
                                            alt={`Option ${index + 1}`}
                                            height={30}
                                            width={30}
                                            className="object-cover rounded-sm w-8 h-8"
                                            priority={index === 0}
                                        />
                                    ) : (
                                        <span
                                            style={{
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                maxWidth: "80%",
                                            }}
                                        >
                                            {result.option}
                                        </span>
                                    )}
                                    <Badge>{result.percentage} %</Badge>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
            <Separator className="my-4" />
            <ChatComponent user={user} entity={question} available={available} />
        </div>
    );
};

export default VoteResults;
