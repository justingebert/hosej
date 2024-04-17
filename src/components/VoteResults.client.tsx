"use client";

import React, { useState, useEffect } from "react";

const VoteResults = ({ questionId }:any) => {
  const [results, setResults] = useState([]);

  useEffect(() => {
    const fetchResults = async () => {
      const res = await fetch(`/api/question/results?questionId=${questionId}`, { cache: 'no-store' });
      const data = await res.json();
      console.log(data);
      setResults(data.results);
    };

    fetchResults();
  }, [questionId]);

  return (
    <div>
      {results.map((result:any, index) => (
        <div key={index} className="bg-slate-100 p-1 my-2 rounded-md relative">
        <div
          className="bg-slate-200 h-10   rounded"
          style={{ width: `${result.percentage}%` }}
        ></div>
        <div className="absolute inset-0 flex justify-between px-3 items-center">
          <span>{result.option}</span>
          <span>{result.percentage + " %"}</span>
        </div>
    </div>
      ))}
    </div>
  );
};

export default VoteResults;
