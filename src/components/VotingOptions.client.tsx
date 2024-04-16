"use client";

import { useUser } from "@/context/UserContext";
import { set } from "mongoose";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";

const VoteOptions = ({ questionId, options, onVote }: any) => {
  const { username } = useUser();
  const [selectedOption, setSelectedOption] = useState<any>(null);

  const submitVote = async () => {
    await fetch(`/api/question/vote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        questionId: questionId,
        option: selectedOption.name,
        user: username,
      }),
    });
    onVote(); // Callback to update state in the parent component
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-4 ">
        {options.map((option, index) => (
          <Button
            key={index}
            onClick={() => {
              setSelectedOption(option);
            }}
            variant={selectedOption === option ? "default" : "secondary"}
          >
            {option.name}
          </Button>
        ))}
      </div>
      <div className="flex justify-center ">
        <Button
          onClick={() => {
            if (selectedOption) {
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
