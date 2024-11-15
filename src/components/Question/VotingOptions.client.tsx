"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image";

const VoteOptions = ({ question, onVote }:any) => {
  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [textResponse, setTextResponse] = useState("");

  const submitVote = async () => {
    const response = question.questionType === "text" ? textResponse : selectedOption;

    await fetch(`/api/groups/${question.groupId}/question/${question._id}/vote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        response: response.key ? response.key : response,
      }),
    });
    onVote();
  };

  return (
    <div className="flex flex-col">
  {question.questionType === "text" ? (
    <div className="flex-grow overflow-auto pb-28 ">
      <Textarea
        value={textResponse}
        onChange={(e) => setTextResponse(e.target.value)}
        placeholder="Enter your response"
        className="w-full h-full"
      />
    </div>
  ) : (
    <div className="grid grid-cols-2 gap-4 pb-32">
      {question.options.map((option: any, index: number) => (
        <Button
          key={index}
          onClick={() => setSelectedOption(option)}
          variant={selectedOption === option ? "default" : "secondary"}
          className="p-2 text-sm md:text-base lg:text-lg h-auto whitespace-normal" // Adjusted text size for responsiveness
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
        if (question.questionType === "text" ? textResponse : selectedOption) {
          submitVote();
        }
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
