"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import Image from "next/image";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import type { Session } from "next-auth";
import { useAppHaptics } from "@/hooks/useAppHaptics";

import type {
    IPairingResult,
    IResult,
    QuestionDTO,
    QuestionResultsDTO,
} from "@/types/models/question";
import { Badge } from "@/components/ui/badge";
import ChatComponent from "@/components/common/Chat";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRightIcon } from "lucide-react";

type VoteResultsProps = {
    user: Session["user"];
    question: QuestionDTO;
    available: boolean;
    returnTo?: string;
};

const VoteResults = ({ user, question, available, returnTo }: VoteResultsProps) => {
    const [animationTriggered, setAnimationTriggered] = useState(false);
    const { play } = useAppHaptics();
    const { data, error } = useSWR<QuestionResultsDTO>(
        `/api/groups/${question.groupId}/question/${question._id}/results/`,
        fetcher
    );

    useEffect(() => {
        if (data) setAnimationTriggered(true);
    }, [data]);

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
                        const visible = topValues.slice(0, 2);
                        const overflow = topValues.length - visible.length;

                        return (
                            <Link
                                key={pr.key}
                                href={`/groups/${question.groupId}/question/${question._id}/resultsdetailed/?returnTo=${encodeURIComponent(returnTo || "")}`}
                                onClick={() => play("selection")}
                            >
                                <div className="bg-secondary my-2 rounded-md p-3 flex items-center gap-2 drop-shadow-sm">
                                    <span
                                        className="font-medium truncate basis-1/3 shrink-0 min-w-0"
                                        title={pr.key}
                                    >
                                        {pr.key}
                                    </span>
                                    <div className="flex items-center justify-end gap-1 flex-1 min-w-0">
                                        {topValues.length === 0 ? (
                                            <Badge variant="outline">-</Badge>
                                        ) : (
                                            <>
                                                {visible.map((tv) => (
                                                    <Badge
                                                        key={tv.value}
                                                        variant={
                                                            topValues.length === 1
                                                                ? "default"
                                                                : "outline"
                                                        }
                                                        className={`min-w-0 max-w-full text-primary ${
                                                            topValues.length === 1
                                                                ? "bg-accent/50"
                                                                : "bg-accent/20"
                                                        }`}
                                                        title={tv.value}
                                                    >
                                                        <span className="truncate">{tv.value}</span>
                                                    </Badge>
                                                ))}
                                                {overflow > 0 && (
                                                    <Badge
                                                        variant="outline"
                                                        className="shrink-0 bg-accent/20 text-primary"
                                                    >
                                                        +{overflow}
                                                    </Badge>
                                                )}
                                            </>
                                        )}
                                    </div>
                                    <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
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
                            <div className="bg-secondary my-2 rounded-2xl relative drop-shadow-sm overflow-hidden">
                                <motion.div
                                    className="bg-accent/10 h-12 rounded-2xl drop-shadow-sm"
                                    initial={{ width: 0 }}
                                    animate={{
                                        width: animationTriggered ? `${result.percentage}%` : "0%",
                                    }}
                                    transition={{ duration: 1, ease: "easeInOut" }}
                                ></motion.div>
                                <div className="absolute inset-0 flex items-center gap-2 px-2">
                                    {isImage ? (
                                        <Image
                                            src={result.option}
                                            alt={`Option ${index + 1}`}
                                            height={30}
                                            width={30}
                                            className="object-cover rounded-sm w-8 h-8 shrink-0"
                                            priority={index === 0}
                                        />
                                    ) : (
                                        <span
                                            className="truncate flex-1 min-w-0"
                                            title={result.option}
                                        >
                                            {result.option}
                                        </span>
                                    )}
                                    {isImage && <div className="flex-1 min-w-0" />}
                                    <Badge className="bg-accent/50 text-primary whitespace-nowrap shrink-0">
                                        {result.percentage}&nbsp;%
                                    </Badge>
                                    <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
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
