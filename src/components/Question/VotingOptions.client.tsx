"use client";

import { useUser } from "@/components/UserContext";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea"

const VoteOptions = ({ user, question, onVote }:any) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [textResponse, setTextResponse] = useState("");

  const submitVote = async () => {
    const response = question.questionType === "text" ? textResponse : selectedOption;

    await fetch(`/api/${question.groupId}/question/vote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        questionId: question._id,
        response: response,
        userThatVoted: user.username,
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
          {question.options.map((option:any, index:number) => (
            <Button
              key={index}
              onClick={() => {
                setSelectedOption(option);
              }}
              variant={selectedOption === option ? "default" : "secondary"}
              className="p-2"
              style={{ whiteSpace: "normal", height: "100%" }}
            >
              {option}
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
