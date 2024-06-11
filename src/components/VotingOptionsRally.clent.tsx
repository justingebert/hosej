"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import Image from "next/image";

const RallyVoteCarousel = ({ rallyId, onVote }: any) => {
  const { username } = useUser();
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const fetchSubmissions = async () => {
      const response = await fetch(`/api/rally/submissions/${rallyId}`);
      const data = await response.json();
      setSubmissions(data.submissions);
      if (data.submissions.length > 0) {
        setSelectedSubmission(data.submissions[0]._id);
      }
    };

    fetchSubmissions();
  }, [rallyId]);

  useEffect(() => {
    if (!api || submissions.length === 0) return;

    const onSelect = () => {
      const selectedIndex = api.selectedScrollSnap();
      if (selectedIndex >= 0 && selectedIndex < submissions.length) {
        setCurrent(selectedIndex);
        setSelectedSubmission(submissions[selectedIndex]._id);
      }
    };

    api.on("select", onSelect);
    onSelect(); // Initial call to set the first selected item

    return () => {
      api.off("select", onSelect); // Clean up the event listener on unmount
    };
  }, [api, submissions]);

  const submitVote = async () => {
    if (!selectedSubmission) {
      alert("Please select a submission to vote for.");
      return;
    }

    await fetch(`/api/rally/vote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        rallyId: rallyId,
        submissionId: selectedSubmission,
        userThatVoted: username,
      }),
    });

    onVote(); // Callback to update state in the parent component
  };

  return (
    <div>
      <Carousel setApi={setApi} className="w-full max-w-xs">
        <CarouselContent>
          {submissions.map((submission, index) => (
            <CarouselItem key={submission._id}>
              <div className="p-1">
                <Card>
                  <CardContent className="flex aspect-square items-center justify-center p-6">
                    <Image
                      src={submission.imageUrl}
                      alt={`Submission by ${submission.username}`}
                      className="object-cover w-full h-full"
                      width={300}
                      height={300}
                      priority={index === 0} // Add priority to the first image
                    />
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
      <div className="flex justify-center">
        <Button onClick={submitVote} className="m-5">
          Vote for this
        </Button>
      </div>
    </div>
  );
};

export default RallyVoteCarousel;
