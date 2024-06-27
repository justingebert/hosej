'use client';

import React from "react";
import Image from "next/image";

const RallyResults = ({ submissions }) => {
  if (!submissions || submissions.length === 0) {
    return <p>No submissions to show.</p>;
  }

  return (
    <div>
      <h1 className="text-center text-2xl font-bold mb-6">Rally Results</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {submissions.map((submission) => (
          <div key={submission._id} className="p-1">
            <div className="flex flex-col items-center">
              <Image
                src={submission.imageUrl}
                alt={`Submission by ${submission.username}`}
                className="object-cover w-full h-full"
                width={300}
                height={300}
              />
              <p className="mt-2">{submission.username}</p>
              <p className="mt-2">{submission.votes.length} votes</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RallyResults;
