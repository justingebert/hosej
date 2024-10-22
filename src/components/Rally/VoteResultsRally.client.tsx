'use client';

import React, { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import ChatComponent from "../Chat/Chat.client";
import { RallyVotesChart } from "../Charts/RallyResultsChart";

const RallyResults = ({ user, rally }: any) => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadedImages, setLoadedImages] = useState<{ [key: number]: boolean }>({})

  useEffect(() => {
    const fetchSubmissions = async () => {
      const response = await fetch(`/api/groups/${rally.groupId}/rally/${rally._id}/submissions`);
      const data = await response.json();
      setSubmissions(data.submissions);
    };
    fetchSubmissions();
  }, [rally]);

  const handleImageLoad = (id: number) => {
    setLoadedImages((prev) => ({ ...prev, [id]: true }))
  }

  return (
    <div>
      <div className="mb-6">
        <RallyVotesChart submissions={submissions}/>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-5">
        {submissions.map((submission, index) => (
          <Card key={submission._id} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between p-5">
              <div className="flex items-center gap-4">
              <Avatar>
                {/* <AvatarImage src={`x`} alt={submission.username} /> */}
                <AvatarFallback>{submission.username[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">{submission.username}</h3>
              </div>
              </div>
              {index < 3 && (
              <Badge variant={index === 0 ? "default" : index === 1 ? "secondary" : "outline"}>
                {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
              </Badge>
            )}
            </CardHeader>
            <CardContent className="p-0 relative">
               <Image
                  src={submission.imageUrl}
                  alt={`Submission by ${submission.username}`}
                  className={`object-cover w-full h-auto cursor-pointer ${loadedImages[index] ? 'opacity-100' : 'opacity-0'}`}
                  width={300}
                  height={300}
                  priority={index === 0}
                  style={{ transition: 'opacity 0.3s ease-in-out' }}
                  onLoad={() => handleImageLoad(index)}
                /> 
            </CardContent>
            <CardFooter className="flex justify-between items-center p-5">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{submission.votes.length}</span>
              <span className="text-m ">votes</span>
            </div>
            <Badge variant="outline">Rank #{index + 1}</Badge>
            </CardFooter>
          </Card>
        ))}
      </div>
      <Separator className="my-6"/>
      <ChatComponent user={user} entity={rally} available={true} />
    </div>
  );
};

export default RallyResults;
