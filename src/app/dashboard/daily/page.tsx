"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "../../../context/UserContext";
import VoteOptions from "../../../Components/VotingOptions.client";
import VoteResults from "../../../Components/VoteResults.client";

const DailyQuestionPage = () => {
  const { username } = useUser();
  const [question, setQuestion] = useState<any>(null);
  const [userHasVoted, setUserHasVoted] = useState(false);

  useEffect(() => {
    const fetchQuestion = async () => {
      const res = await fetch(`/api/question/daily`);
      const data = await res.json();
      setQuestion(data.question);
      const hasVoted = data.question.answers.some((answer: any) => answer.username === username);
      setUserHasVoted(hasVoted);
    };

    if (username) {
      fetchQuestion();
    }
  }, [username]);

  if (!question) return <div>Loading question...</div>;

  return (
    <div>
      <h1>{question.question}</h1>
      {userHasVoted ? (
        <VoteResults questionId={question._id} />
      ) : (
        <VoteOptions
          questionId={question._id}
          options={question.options}
          onVote={() => setUserHasVoted(true)}
        />
      )}
    </div>
  );
};

export default DailyQuestionPage;
