"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import type { QuestionOptionDTO, QuestionWithUserStateDTO } from "@/types/models/question";

function optionResponseValue(option: QuestionOptionDTO): string {
    return typeof option === "string" ? option : option.key;
}

const VoteOptions = ({
    question,
    onVote,
}: {
    question: Pick<QuestionWithUserStateDTO, "_id" | "groupId" | "questionType" | "options">;
    onVote: () => void;
}) => {
    const isMultipleSelection = question.questionType.includes("multiple");
    const isText = question.questionType === "text";
    const options = useMemo(() => question.options ?? [], [question.options]);

    const [textResponse, setTextResponse] = useState<string>("");
    const [selectedResponses, setSelectedResponses] = useState<string[]>([]);

    const toggleOption = (option: QuestionOptionDTO) => {
        const value = optionResponseValue(option);
        setSelectedResponses((prev) => {
            if (isMultipleSelection) {
                return prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value];
            }
            return [value];
        });
    };

    const submitVote = async () => {
        const response = isText ? [textResponse] : selectedResponses;

        await fetch(`/api/groups/${question.groupId}/question/${question._id}/vote`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                response,
            }),
        });

        onVote();
    };

    return (
        <div className="flex flex-col">
            {isText ? (
                <div className="flex-grow overflow-auto pb-28">
                    <Textarea
                        value={textResponse}
                        onChange={(e) => setTextResponse(e.target.value)}
                        placeholder="Enter your response"
                        className="w-full h-full"
                    />
                </div>
            ) : (
                <div className={`grid grid-cols-2 gap-4 pb-32`}>
                    {options.map((option: QuestionOptionDTO, index) => (
                        <Button
                            key={index}
                            onClick={() => toggleOption(option)}
                            variant={
                                selectedResponses.includes(optionResponseValue(option))
                                    ? "default"
                                    : "secondary"
                            }
                            className="p-2 text-sm md:text-base lg:text-lg h-auto whitespace-normal"
                        >
                            {question.questionType.startsWith("image") ? (
                                typeof option === "string" ? null : (
                                    <Image
                                        src={option.url}
                                        alt={`Option ${index + 1}`}
                                        width={100}
                                        height={100}
                                        className="w-full h-full object-cover rounded-sm"
                                    />
                                )
                            ) : typeof option === "string" ? (
                                option
                            ) : (
                                optionResponseValue(option)
                            )}
                        </Button>
                    ))}
                </div>
            )}

            <div className="fixed bottom-0 left-0 w-full backdrop-blur-md pb-10 pt-4 px-6">
                <Button
                    onClick={() => {
                        const hasResponse =
                            question.questionType === "text"
                                ? textResponse.trim().length > 0
                                : selectedResponses.length > 0;

                        if (hasResponse) submitVote();
                    }}
                    className="w-full h-12 text-lg font-bold"
                >
                    Submit
                </Button>
            </div>
        </div>
    );
};

export default VoteOptions;
