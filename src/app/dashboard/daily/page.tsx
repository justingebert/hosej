"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "../../../context/UserContext";
import VoteOptions from "../../../components/VotingOptions.client";
import VoteResults from "../../../components/VoteResults.client";
import { Button } from "@/components/ui/button"
import Link from 'next/link';
import { unstable_noStore } from "next/cache";
import { useRouter } from "next/navigation";


const DailyQuestionPage = () => {
  const { username } = useUser();
  const [question, setQuestion] = useState<any>(null);
  const [userHasVoted, setUserHasVoted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    unstable_noStore()
    const fetchQuestion = async () => {
      router.refresh()
      const res = await fetch(`/api/question/daily`, { cache: 'no-store' });
      const data = await res.json();

      console.log(data);
      if(data.question){
        setQuestion(data.question);
        console.log(data.question);
        const hasVoted = data.question.answers.some((answer: any) => answer.username.username === username);
        setUserHasVoted(hasVoted);
      }
    };

    if (username) {
      fetchQuestion();
    }
  }, [username]);

  const getNewQuestion = async () => {
    const res = await fetch(`/api/question/daily/update`, { cache: 'no-store' });
    const data = await res.json();
    
    if(data.message){
      alert(data.message);
    }

    if(data.question){
      setQuestion(data.question);
      console.log(data.question);
      const hasVoted = data.question.answers.some((answer: any) => answer.username === username);
      setUserHasVoted(hasVoted);
    }
  }

  return (
    <div className="m-6">
      <div className="flex items-center">
        <Link className="text-lg leading-none mr-auto cursor-pointer" href="/">
          ← 
        </Link>
      </div>
      <h1 className="text-xl font-bold flex-1 text-center">Daily Question</h1>
      {question ? (
        <>
        <div className="flex justify-center p-2 mb-20 text-center">
          <h1>{question.question}</h1>
        </div>
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
      <div className="flex justify-center m-2 ">
        <Button onClick={getNewQuestion} variant={"outline"} className="absolute bottom-7">Get New Question</Button>
      </div>
    </div>
  );
};

export default DailyQuestionPage;
