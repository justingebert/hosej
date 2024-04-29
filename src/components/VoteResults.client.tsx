"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import ChatComponent from "./Chat.client";

const VoteResults = ({ question }: any) => {
  const [results, setResults] = useState([]);
  const [numOfVotes, setNumOfVotes] = useState('');

  useEffect(() => {
    const fetchResults = async () => {
      const res = await fetch(
        `/api/question/results?questionId=${question._id}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      console.log(data);
      setResults(data.results);
      setNumOfVotes(`${data.totalVotes} of ${data.totalUsers} voted`);
    };

    fetchResults();
  }, [question]);

  return (
    <div>
      <div className="flex justify-center">
        {numOfVotes}
      </div>
      {results.map((result: any, index) => (
        <Link key={index} href={`/dashboard/daily/resultsdetailed/${question._id}?returnTo=${question._id}`}>
          <div className="bg-secondary p-1 my-2 rounded-md relative">
            <div
              className="bg-secondarydark h-10 rounded"
              style={{ width: `${result.percentage}%` }}
            ></div>
            <div className="absolute inset-0 flex justify-between px-3 items-center">
              <span>{result.option}</span>
              <span>{result.percentage + " %"}</span>
            </div>
          </div>
        </Link>
      ))}
      <ChatComponent questionId={question._id} />
    </div>
  );
};

export default VoteResults;
