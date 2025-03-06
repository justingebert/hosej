"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import Modal from "react-modal";
import { X } from "lucide-react";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import { IPictureSubmission } from "@/types/models/rally";

const RallyVoteCarousel = ({ user, rally, onVote }: any) => {
    const [selectedSubmission, setSelectedSubmission] = useState<string>("");
    const [api, setApi] = useState<CarouselApi | null>(null);
    const [hasVoted, setHasVoted] = useState(false);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const { data, isLoading } = useSWR<{ submissions: IPictureSubmission[] }>(
        `/api/groups/${rally.groupId}/rally/${rally._id}/submissions`,
        fetcher
    );

    const submissions = useMemo(() => data?.submissions || [], [data]);

    useEffect(() => {
        if (submissions.length > 0) {
            setSelectedSubmission(submissions[0]._id.toString());
        }

        const userHasVoted = submissions.some((submission: any) =>
            submission.votes.some((vote: any) => vote.user === user._id)
        );
        setHasVoted(userHasVoted);
    }, [submissions, user]);

    useEffect(() => {
        if (!api || submissions.length === 0) return;

        const onSelect = () => {
            const selectedIndex = api.selectedScrollSnap();
            if (selectedIndex >= 0 && selectedIndex < submissions.length) {
                setSelectedSubmission(submissions[selectedIndex]._id.toString());
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

        await fetch(
            `/api/groups/${rally.groupId}/rally/${rally._id}/submissions/${selectedSubmission}/vote`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        setHasVoted(true);

        onVote();
    };

    const modalStyles = {
        content: {
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            border: "none",
            background: "none",
            overflow: "auto",
        },
        overlay: {
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            zIndex: 1000,
        },
    };

    return (
        <div className="flex flex-col grow justify-between">
            <Carousel setApi={setApi} orientation="vertical" className="mt-20">
                <CarouselContent className="w-full h-[50dvh]">
                    {submissions.map((submission, index) => (
                        <CarouselItem key={submission._id.toString()} className="h-[50dvh]">
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
            <div className="flex justify-center mb-6">
                <Button
                    onClick={submitVote}
                    className="mt-24 w-full h-12 text-lg font-bold"
                    disabled={hasVoted || modalIsOpen}
                >
                    Vote for this
                </Button>
            </div>
            <Modal
                isOpen={modalIsOpen}
                ariaHideApp={false}
                onRequestClose={closeModal}
                contentLabel="Image Modal"
                className="flex justify-center items-center"
                overlayClassName="fixed inset-0 bg-black bg-opacity-50 bg-blur"
                style={modalStyles}
            >
                {selectedImage && (
                    <div className=" relative p-4">
                        <Image
                            src={selectedImage}
                            alt="Selected Submission"
                            width={600}
                            height={600}
                            className="rounded-md "
                        />
                        <Button
                            onClick={closeModal}
                            className="absolute top-4 right-2"
                            variant={"ghost"}
                        >
                            <X />
                        </Button>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default RallyVoteCarousel;
