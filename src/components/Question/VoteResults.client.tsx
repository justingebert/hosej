"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import ChatComponent from "../Chat/Chat.client";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { Badge } from "../ui/badge";
import Image from "next/image";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import { Skeleton } from "../ui/skeleton";
import { UserDTO } from "@/types/models/user";
import { useHaptic } from "use-haptic";

import { QuestionDTO } from "@/types/models/question";

type VoteResultsProps = {
    user: UserDTO;
    question: QuestionDTO;
    available: boolean;
    returnTo?: string;
};

const VoteResults = ({ user, question, available, returnTo }: VoteResultsProps) => {
    const [animationTriggered, setAnimationTriggered] = useState(false);
    const { triggerHaptic } = useHaptic();
    const { data, error } = useSWR<any>(`/api/groups/${question.groupId}/question/${question._id}/results/`, fetcher);

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
    const numOfVotes = `${data.totalVotes} of ${data.totalUsers} voted`;

    return (
        <div>
            <div className="flex justify-center">{numOfVotes}</div>
            <div className="mb-10">
                {results.map((result: any, index: number) => (
                    <Link
                        key={index}
                        href={`/groups/${question.groupId}/question/${question._id}/resultsdetailed/?returnTo=${returnTo}`}
                        onClick={triggerHaptic}
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
                                {question.questionType.startsWith("image") ? (
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
                                <Badge>
                                    <CountUpBadge targetPercentage={result.percentage} />
                                </Badge>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
            <Separator />
            <ChatComponent user={user} entity={question} available={available} />
        </div>
    );
};

export default VoteResults;

const CountUpBadge = ({ targetPercentage }: { targetPercentage: number }) => {
    const [currentPercentage, setCurrentPercentage] = useState(0);

    useEffect(() => {
        const duration = 1000; // duration of the count up in milliseconds
        const intervalTime = 16; // update interval in milliseconds
        const totalSteps = duration / intervalTime;
        const increment = targetPercentage / totalSteps;

        let currentStep = 0;
        const interval = setInterval(() => {
            currentStep++;
            setCurrentPercentage((prev) => Math.min(prev + increment, targetPercentage));
            if (currentStep >= totalSteps) {
                clearInterval(interval);
            }
        }, intervalTime);

        return () => clearInterval(interval);
    }, [targetPercentage]);

    return <span>{Math.round(currentPercentage)} %</span>;
};
