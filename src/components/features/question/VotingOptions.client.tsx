"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";

const VoteOptions = ({ question, onVote }: any) => {
    // Check if the question allows multiple selections
    const multiple = question.questionType.includes("multiple");
    const text = question.questionType === "text";

    const [textResponse, setTextResponse] = useState<string>("");
    const [selectedOptions, setSelectedOptions] = useState<any[]>(multiple ? [] : [null]);

    const toggleOption = (option: any) => {
        setSelectedOptions((prev) => {
            if (multiple) {
                return prev.includes(option)
                    ? prev.filter((o) => o !== option) // Remove option if already selected
                    : [...prev, option]; // Add option if not selected
            }
            return [option]; // Replace with the selected option for single selection
        });
    };

    const submitVote = async () => {
        const response = text ? [textResponse] : selectedOptions;
        const processedResponse = response.map((res: any) => (res.key ? res.key : res));

        await fetch(`/api/groups/${question.groupId}/question/${question._id}/vote`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                response: processedResponse,
            }),
        });

        onVote();
    };

    return (
        <div className="flex flex-col">
            {text ? (
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
                    {question.options.map((option: any, index: number) => (
                        <Button
                            key={index}
                            onClick={() => toggleOption(option)}
                            variant={selectedOptions.includes(option) ? "default" : "secondary"}
                            className="p-2 text-sm md:text-base lg:text-lg h-auto whitespace-normal"
                        >
                            {question.questionType.startsWith("image") ? (
                                <Image
                                    src={option.url}
                                    alt={`Option ${index + 1}`}
                                    width={100}
                                    height={100}
                                    className="w-full h-full object-cover rounded-sm"
                                />
                            ) : (
                                option
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
                                ? textResponse
                                : selectedOptions.length > 0;

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
