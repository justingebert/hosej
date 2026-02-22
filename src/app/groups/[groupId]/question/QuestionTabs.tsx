"use client";

import { useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import VoteOptions from "@/components/features/question/VotingOptions.client";
import VoteResults from "@/components/features/question/VoteResults.client";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { mutate } from "swr";
import { CheckCheck } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import type { UserDTO } from "@/types/models/user";
import type {
    QuestionOptionDTO,
    QuestionWithUserStateDTO,
    UserRating,
} from "@/types/models/question";
import { buildFlatQuestionList } from "@/components/features/question/questionTabsUtils";

type RateValue = Exclude<UserRating, null>;

export default function QuestionsTabs({
    user,
    groupId,
    questions,
}: {
    user: UserDTO;
    groupId: string;
    questions: QuestionWithUserStateDTO[];
}) {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const searchParams = useSearchParams();
    const router = useRouter();

    // Build flat list with labels
    const flatList = useMemo(() => buildFlatQuestionList(questions), [questions]);

    // Determine default tab
    const returnToParam = searchParams?.get("returnTo");
    const defaultTab =
        returnToParam || (flatList.length > 0 ? flatList[0].question._id : undefined);

    const rateQuestion = async (questionId: string, rating: RateValue) => {
        await fetch(`/api/groups/${groupId}/question/${questionId}/rate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rating }),
        });

        mutate(`/api/groups/${groupId}/question`);
    };

    const handleDrawer = () => {
        setDrawerOpen(!drawerOpen);
    };

    const handleTabChange = (tabValue: string) => {
        router.push(`/groups/${groupId}/question?returnTo=${tabValue}`);
    };

    return (
        <Tabs defaultValue={defaultTab} onValueChange={handleTabChange}>
            <TabsList
                className="grid w-full mb-10"
                style={{
                    gridTemplateColumns: `repeat(${flatList.length}, minmax(0, 1fr))`,
                }}
            >
                {flatList.map(({ question, label }) => (
                    <TabsTrigger key={question._id} value={question._id}>
                        {label}
                    </TabsTrigger>
                ))}
            </TabsList>

            {flatList.map(({ question }) => (
                <TabsContent key={question._id} value={question._id}>
                    <QuestionContent
                        user={user}
                        groupId={groupId}
                        question={question}
                        drawerOpen={drawerOpen}
                        setDrawerOpen={setDrawerOpen}
                        rateQuestion={rateQuestion}
                        handleDrawer={handleDrawer}
                    />
                </TabsContent>
            ))}
        </Tabs>
    );
}

// Extracted question content component
function QuestionContent({
    user,
    groupId,
    question,
    drawerOpen,
    setDrawerOpen,
    rateQuestion,
    handleDrawer,
}: {
    user: UserDTO;
    groupId: string;
    question: QuestionWithUserStateDTO;
    drawerOpen: boolean;
    setDrawerOpen: Dispatch<SetStateAction<boolean>>;
    rateQuestion: (questionId: string, rating: RateValue) => Promise<void>;
    handleDrawer: () => void;
}) {
    return (
        <>
            <RatingDrawer
                drawerOpen={drawerOpen}
                setDrawerOpen={setDrawerOpen}
                question={question}
                rateQuestion={rateQuestion}
            />

            {question.imageUrl && (
                <Image
                    src={question.imageUrl}
                    alt={`${question.question}`}
                    className="object-cover w-full h-full cursor-pointer rounded-lg mt-4"
                    width={300}
                    height={300}
                />
            )}
            <div className="mt-10">
                {question.userHasVoted ? (
                    <VoteResults
                        user={user}
                        question={question}
                        available={true}
                        returnTo={`?returnTo=${question._id}`}
                    />
                ) : (
                    <VoteOptions
                        question={question}
                        onVote={() => {
                            mutate(`/api/groups/${groupId}/question`);
                            handleDrawer();
                        }}
                    />
                )}
            </div>
        </>
    );
}

function RatingDrawer({
    drawerOpen,
    setDrawerOpen,
    question,
    rateQuestion,
}: {
    drawerOpen: boolean;
    setDrawerOpen: Dispatch<SetStateAction<boolean>>;
    question: QuestionWithUserStateDTO;
    rateQuestion: (questionId: string, rating: RateValue) => Promise<void>;
}) {
    return (
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerTrigger className="w-full">
                <Card className="relative bg-foreground text-center">
                    <h2 className="font-bold p-6 text-secondary">{question.question}</h2>
                    {question.questionType.includes("multiple") && (
                        <CheckCheck className="absolute bottom-2 right-2 text-secondary w-4 h-4" />
                    )}
                </Card>
            </DrawerTrigger>
            <DrawerContent className="p-4 max-h-[80vh] flex flex-col">
                <DrawerHeader>
                    <DrawerTitle>Rate the Question</DrawerTitle>
                    <DrawerDescription></DrawerDescription>
                </DrawerHeader>
                {!question.questionType.startsWith("text") && (
                    <>
                        <div className="overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                {question.questionType.startsWith("image") &&
                                    question.options &&
                                    question.options.map((option: QuestionOptionDTO, index) => {
                                        if (typeof option === "string") return null;
                                        return (
                                            <div
                                                key={index}
                                                className="text-primary-foreground rounded-lg w-full max-w-md h-40"
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
                                        );
                                    })}
                                {!question.questionType.startsWith("image") &&
                                    question.options &&
                                    question.options.map((option: QuestionOptionDTO, index) => (
                                        <div
                                            key={index}
                                            className="text-sm p-2 bg-secondary rounded-lg max-w-md text-center flex items-center justify-center overflow-hidden"
                                        >
                                            <span className="line-clamp-3">
                                                {typeof option === "string" ? option : option.key}
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                        <Separator className="my-6" />
                    </>
                )}
                <div>
                    <div className="flex flex-row justify-center space-x-4">
                        <Badge>🐟{question.rating.bad.length || 0}</Badge>
                        <Badge>👍{question.rating.ok.length || 0}</Badge>
                        <Badge>🐐{question.rating.good.length || 0}</Badge>
                    </div>
                    <div className="flex flex-row space-x-4 py-4">
                        <Button
                            className="text-3xl flex-1 py-8"
                            variant={question.userRating === "bad" ? "default" : "secondary"}
                            onClick={() => rateQuestion(question._id, "bad")}
                            disabled={question.userRating === "bad"}
                        >
                            🐟
                        </Button>
                        <Button
                            className="text-3xl flex-1 py-8"
                            variant={question.userRating === "ok" ? "default" : "secondary"}
                            onClick={() => rateQuestion(question._id, "ok")}
                            disabled={question.userRating === "ok"}
                        >
                            👍
                        </Button>
                        <Button
                            className="text-3xl flex-1 py-8"
                            variant={question.userRating === "good" ? "default" : "secondary"}
                            onClick={() => rateQuestion(question._id, "good")}
                            disabled={question.userRating === "good"}
                        >
                            🐐
                        </Button>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
