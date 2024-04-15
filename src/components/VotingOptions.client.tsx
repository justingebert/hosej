"use client";

import { useUser } from "@/context/UserContext";
import { set } from "mongoose";
import React, { useState } from "react";

const VoteOptions = ({ questionId, options, onVote }:any) => {
  const { username } = useUser();
  const [selectedOption, setSelectedOption] = useState<any>(null);

  const submitVote = async () => {
    await fetch(`/api/question/vote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ questionId: questionId, option: selectedOption.name, user: username }),
    });
    onVote(); // Callback to update state in the parent component
  };

  return (
    <>
      <h2>Choose your answer:</h2>
      <div>
        {options.map((option, index) => (
          <button
            className={`rounded m-2 p-2 ${
              selectedOption?.name === option.name ? "bg-slate-300" : "bg-slate-600"
            }`}
            key={index}
            onClick={() => {
              setSelectedOption(option);
            }}
          >
            {option.name}
          </button>
        ))}
      </div>
      <button
        onClick={() => {
          if(selectedOption){
            submitVote();
          }
          
        }}
        className={`rounded m-2 p-2 bg-red-100 hover:bg-red-300`}
      >
        Submit
      </button>
    </>
  );
};

export default VoteOptions;
