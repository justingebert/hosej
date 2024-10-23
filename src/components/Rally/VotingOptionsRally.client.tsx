"use client";

import React, { useState, useEffect } from "react";
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
import { useRouter } from "next/navigation";
import Modal from 'react-modal';
import { X } from 'lucide-react';

const RallyVoteCarousel = ({ user, rally, onVote }: any) => {
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [current, setCurrent] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const router = useRouter();


  useEffect(() => {
    const fetchSubmissions = async () => {
      const response = await fetch(`/api/groups/${rally.groupId}/rally/${rally._id}/submissions`);
      const data = await response.json();
      setSubmissions(data.submissions);
      if (data.submissions.length > 0) {
        setSelectedSubmission(data.submissions[0]._id);
      }

      // Check if the user has already voted
      const userHasVoted = data.submissions.some((submission:any) =>
        submission.votes.some((vote:any) => vote.user === user._id)
      );
      setHasVoted(userHasVoted);
    };

    fetchSubmissions();
  }, [rally, user]);

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

  const openModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setSelectedImage(null);
    setModalIsOpen(false);
  };

  const submitVote = async () => {
    if (!selectedSubmission) {
      alert("Please select a submission to vote for.");
      return;
    }

    await fetch(`/api/groups/${rally.groupId}/rally/${rally._id}/submissions/${selectedSubmission}/vote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userThatVoted: user._id,
      }),
    });

    setHasVoted(true);

    onVote(); // Callback to update state in the parent component
  };

  const customStyles = {
    content: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      border: 'none',
      background: 'none',
      overflow: 'auto', // Ensure the content can scroll on mobile
    },
    overlay: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      zIndex: 1000, // Ensure the overlay is on top
    },
  };

  return (
    <div className="flex flex-col grow justify-between" >
      <Carousel setApi={setApi} orientation="vertical" className="mt-20">
        <CarouselContent className="w-full h-[50dvh]">
          {submissions.map((submission, index) => (
            <CarouselItem key={submission._id} className="h-[50dvh]">
              <Card className="overflow-hidden rounded-md h-full">
                <CardContent className="h-full p-0">
                  <div className="relative h-full w-full overflow-hidden rounded-md">
                    <Image
                      src={submission.imageUrl}
                      alt={`Submission by ${submission.username}`}
                      className="object-cover w-full h-full cursor-pointer"
                      width={300}
                      height={300}
                      priority={index === 0} // Add priority to the first image
                      onClick={() => openModal(submission.imageUrl)}
                    />
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))} 
        </CarouselContent>
        <CarouselPrevious className="h-[40dvh] rounded-md -translate-y-[18dvh] " />
        <CarouselNext className="h-[40dvh] rounded-md translate-y-[18dvh]" />
      </Carousel>
        <div className="flex justify-center">
          <Button onClick={submitVote} className="mt-24 w-full" disabled={hasVoted || modalIsOpen}>
            vote for this
          </Button>
        </div>
      <Modal
        isOpen={modalIsOpen}
        ariaHideApp={false}
        onRequestClose={closeModal}
        contentLabel="Image Modal"
        className="flex justify-center items-center"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 bg-blur"
        style={customStyles}
      >
        {selectedImage && (
          <div className=" relative p-4">
            <Image src={selectedImage} alt="Selected Submission" width={600} height={600} className="rounded-md " />
            <Button onClick={closeModal} className="absolute top-4 right-2" variant={"ghost"}><X /></Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RallyVoteCarousel;
