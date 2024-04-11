'use client';

import React, { useState, useEffect } from "react";

const VoteResults = ({ questionId }) => {
  const [results, setResults] = useState([]);

  useEffect(() => {
    const fetchResults = async () => {
      const res = await fetch(`/api/question/results?questionId=${questionId}`);
      const data = await res.json();
      setResults(data.results);
    };

    fetchResults();
  }, [questionId]);

  return (
    <div>
      <h2>Results:</h2>
      {results.map((result, index) => (
        <div key={index}>{`${result.option}: ${result.votes}`}</div>
      ))}
    </div>
  );
};

export default VoteResults;
