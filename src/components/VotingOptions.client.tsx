'use client';

import { useUser } from "@/context/UserContext";
import React from "react";

const VoteOptions = ({ questionId, options, onVote }) => {
  const { username } = useUser();

  const submitVote = async (option) => {
    await fetch(`/api/question/vote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ questionId, option, username }),
    });
    onVote(); // Callback to update state in the parent component
  };

  return (
    <div>
      <h2>Choose your answer:</h2>
      {options.map((option, index) => (
        <button key={index} onClick={() => submitVote(option)}>
          {option.name}
        </button>
      ))}
    </div>
  );
};

export default VoteOptions;
