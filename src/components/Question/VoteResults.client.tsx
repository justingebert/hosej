"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import ChatComponent from "../Chat/Chat.client";
import { Separator } from "@/components/ui/separator";
import { motion } from 'framer-motion';
import { Badge } from "../ui/badge";
import Image from "next/image";

const VoteResults = ({ user, question, available }: any) => {
  const [animationTriggered, setAnimationTriggered] = useState(false);
  const [results, setResults] = useState([]);
  const [numOfVotes, setNumOfVotes] = useState('');

  useEffect(() => {
    const fetchResults = async () => {
      const res = await fetch(
        `/api/${question.groupId}/question/${question._id}/results/`);
      const data = await res.json();
      setResults(data.results);
      setNumOfVotes(`${data.totalVotes} of ${data.totalUsers} voted`);
    };

    fetchResults();
    setAnimationTriggered(true);
  }, [question]);

  return (
    <div>
      <div className="flex justify-center">
        {numOfVotes}
      </div>
      <div className="mb-10">
        {results.map((result: any, index) => (
          <Link key={index} href={`/groups/${question.groupId}/question/${question._id}/resultsdetailed/`}>
            <div className="bg-secondary my-2 rounded-md relative">
              <motion.div
                className="bg-secondarydark h-12 rounded"
                initial={{ width: 0 }}
                animate={{ width: animationTriggered ? `${result.percentage}%` : '0%' }}
                transition={{ duration: 1, ease: 'easeInOut' }}
              ></motion.div>
              <div className="absolute inset-0 flex justify-between px-2 items-center">
              {question.questionType.startsWith("image") ? (
                    <Image
                      src={result.option}
                      alt={`Option ${index + 1}`}
                      width={45}
                      height={45}
                      className="object-cover rounded-sm"
                      priority={index === 0}
                    />
                  ) : (
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80%' }}>
                      {result.option}
                    </span>
                  )}
                <Badge>
                  <CountUpBadge targetPercentage={result.percentage} />
                </Badge>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <Separator />
      <ChatComponent user={user} entity={question} available={available} />
    </div>
  );
};

export default VoteResults;

const CountUpBadge = ({ targetPercentage }: { targetPercentage: number }) => {
  const [currentPercentage, setCurrentPercentage] = useState(0);

  useEffect(() => {
    const duration = 1000; // duration of the count up in milliseconds
    const intervalTime = 16; // update interval in milliseconds
    const totalSteps = duration / intervalTime;
    const increment = targetPercentage / totalSteps;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      setCurrentPercentage(prev => Math.min(prev + increment, targetPercentage));
      if (currentStep >= totalSteps) {
        clearInterval(interval);
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, [targetPercentage]);

  return <span>{Math.round(currentPercentage)} %</span>;
};
