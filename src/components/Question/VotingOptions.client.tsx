"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image";

const VoteOptions = ({ user, question, onVote }:any) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [textResponse, setTextResponse] = useState("");

  const submitVote = async () => {
    const response = question.questionType === "text" ? textResponse : selectedOption;

    await fetch(`/api/groups/${question.groupId}/question/${question._id}/vote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        response: response,
        userThatVoted: user._id,
      }),
    });
    onVote(); // Callback to update state in the parent component
  };

  return (
    <>
      {question.questionType === "text" ? (
        <div className="flex flex-col items-center">
          <Textarea
            value={textResponse}
            onChange={(e) => setTextResponse(e.target.value)}
            placeholder="Enter your response"
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {question.options.map((option: any, index: number) => (
            <Button
              key={index}
              onClick={() => {
                setSelectedOption(option);
              }}
              variant={selectedOption === option ? "default" : "secondary"}
              className="p-2"
              style={{ whiteSpace: "normal", height: "100%" }}
            >
              {question.questionType.startsWith("image") ? (
                <Image src={option} alt={`Option ${index + 1}`} width={100} height={100} className="w-full h-full object-cover rounded-sm"/>
              ) : (
                option
              )}
            </Button>
          ))}
        </div>
      )}
      <div className="flex justify-center realtive bottom-20 left-0 w-full p-2 bg-background">
        <Button
          onClick={() => {
            if (question.questionType === "text" ? textResponse : selectedOption) {
              submitVote();
            }
          }}
          className="m-5"
        >
          Submit
        </Button>
      </div>
    </>
  );
};

export default VoteOptions;
