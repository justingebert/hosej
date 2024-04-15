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
      if(data.question){
        setQuestion(data.question);
        console.log(data.question);
        const hasVoted = data.question.answers.some((answer: any) => answer.username === username);
        setUserHasVoted(hasVoted);
      }
    };

    if (username) {
      fetchQuestion();
    }
  }, [username]);

  const getNewQuestion = async () => {
    const res = await fetch(`/api/question/daily/update`);
    const data = await res.json();
    if(data.question){
      setQuestion(data.question);
      console.log(data.question);
      const hasVoted = data.question.answers.some((answer: any) => answer.username === username);
      setUserHasVoted(hasVoted);
    }
  }

  return (
    <div>
      {question ? (
        <>
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
        </>
      ) : (
        <div>Loading question...</div>
      )}
      <button onClick={getNewQuestion}>Get New Question</button>
    </div>
  );
};

export default DailyQuestionPage;
