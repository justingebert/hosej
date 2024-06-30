"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@/components/UserContext";
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

const RallyVoteCarousel = ({ rallyId, onVote }: any) => {
  const { username } = useUser();
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
      const response = await fetch(`/api/rally/submissions/${rallyId}`);
      const data = await response.json();
      setSubmissions(data.submissions);
      if (data.submissions.length > 0) {
        setSelectedSubmission(data.submissions[0]._id);
      }

      // Check if the user has already voted
      const userHasVoted = data.submissions.some((submission:any) =>
        submission.votes.some((vote:any) => vote.username === username)
      );
      setHasVoted(userHasVoted);
    };

    fetchSubmissions();
  }, [rallyId, username]);

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

    await fetch(`/api/rally/submissions/vote`, {
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
    <div >
      <div className="flex justify-center">
      <Carousel setApi={setApi} className="w-full max-w-xs mb-20 mt-5" orientation="vertical">
        <CarouselContent className="h-[340px]">
          {submissions.map((submission, index) => (
            <CarouselItem key={submission._id}>
                <Card>
                  <CardContent className="flex aspect-square items-center justify-center p-6">
                    <Image
                      src={submission.imageUrl}
                      alt={`Submission by ${submission.username}`}
                      className="object-cover w-full h-full cursor-pointer"
                      width={300}
                      height={300}
                      priority={index === 0} // Add priority to the first image
                      onClick={() => openModal(submission.imageUrl)}
                    />
                  </CardContent>
                </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
      </div>
      {hasVoted ? (
        <div className="flex justify-center">
          <p>You have already voted!</p>
        </div>
      ) : (
        <div className="flex justify-center">
          <Button onClick={submitVote} className="m-5">
            Vote for this
          </Button>
        </div>
      )}
      <Modal
        isOpen={modalIsOpen}
        ariaHideApp={false}
        onRequestClose={closeModal}
        contentLabel="Image Modal"
        className="flex justify-center items-center"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50"
        style={customStyles}
      >
        {selectedImage && (
          <div className=" p-4 rounded">
            <Image src={selectedImage} alt="Selected Submission" width={600} height={600} />
            <Button onClick={closeModal} className="mt-4 p-2 bg-gray-800 text-white rounded">Close</Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RallyVoteCarousel;
