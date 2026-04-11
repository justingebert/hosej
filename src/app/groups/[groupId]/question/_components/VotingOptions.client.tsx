"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import type { QuestionOptionDTO, QuestionWithUserStateDTO } from "@/types/models/question";
import PairingVoting from "./PairingVoting";
import { useQuestionActions } from "@/hooks/data/useActiveQuestions";

function optionResponseValue(option: QuestionOptionDTO): string {
    return typeof option === "string" ? option : option.key;
}

const VoteOptions = ({
    question,
    onVote,
}: {
    question: Pick<
        QuestionWithUserStateDTO,
        "_id" | "groupId" | "questionType" | "multiSelect" | "options" | "pairing"
    >;
    onVote: () => void;
}) => {
    const isMultipleSelection = question.multiSelect;
    const isText = question.questionType === "text";
    const isPairing = question.questionType === "pairing";
    const isImage = question.questionType === "image";
    const options = useMemo(() => question.options ?? [], [question.options]);

    const [textResponse, setTextResponse] = useState<string>("");
    const [selectedResponses, setSelectedResponses] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { voteQuestion } = useQuestionActions(question.groupId);

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
        if (isSubmitting) return;
        setIsSubmitting(true);
        const response = isText ? [textResponse] : selectedResponses;

        try {
            await voteQuestion(question._id, response);
            onVote();
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isPairing) {
        return <PairingVoting question={question} onVote={onVote} />;
    }

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
                            {isImage ? (
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
                    disabled={isSubmitting}
                    className="w-full h-12 text-lg font-bold"
                >
                    {isSubmitting ? "Submitting..." : "Submit"}
                </Button>
            </div>
        </div>
    );
};

export default VoteOptions;
