'use client';

import React from "react";

const VoteOptions = ({ questionId, options, onVote }) => {
  const submitVote = async (option) => {
    // Assuming you have an API endpoint to submit the vote
    await fetch(`/api/question/vote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ questionId, option }),
    });
    onVote(); // Callback to update state in the parent component
  };

  return (
    <div>
      <h2>Choose your answer:</h2>
      {options.map((option, index) => (
        <button key={index} onClick={() => submitVote(option)}>
          {option}
        </button>
      ))}
    </div>
  );
};

export default VoteOptions;
