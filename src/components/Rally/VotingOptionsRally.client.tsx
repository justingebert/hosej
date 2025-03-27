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
import Modal from "react-modal";
import { X } from "lucide-react";
import { mutate } from "swr";
import { RallyWithUserState, voteRallyRequest } from "@/types/api";
import { useToast } from "@/hooks/use-toast";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";

const RallyVoteCarousel = ({ rally }: {rally:RallyWithUserState}) => {
    const { user } = useAuthRedirect();
    const [selectedSubmission, setSelectedSubmission] = useState<string>("");
    const [api, setApi] = useState<CarouselApi | null>(null);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (rally.submissions.length > 0) {
            setSelectedSubmission(rally.submissions[0]._id.toString());
        }
    }, [rally]);

    useEffect(() => {
        if (!api || rally.submissions.length === 0) return;

        const onSelect = () => {
            const selectedIndex = api.selectedScrollSnap();
            if (selectedIndex >= 0 && selectedIndex < rally.submissions.length) {
                setSelectedSubmission(rally.submissions[selectedIndex]._id.toString());
            }
        };

        api.on("select", onSelect);
        onSelect(); // Initial call to set the first selected item

        return () => {
            api.off("select", onSelect); // Clean up the event listener on unmount
        };
    }, [api, rally]);

    const ownSubmission = rally.submissions.find((submission) => submission.userId === user._id)?._id.toString();

    const openModal = (imageUrl: string) => {
        setSelectedImage(imageUrl);
        setModalIsOpen(true);
    };

    const closeModal = () => {
        setSelectedImage(null);
        setModalIsOpen(false);
    };

    const submitVote = async () => {
        if (!selectedSubmission) return;
        const req: voteRallyRequest = {
            submissionId: selectedSubmission,
        };

        const res = await fetch(`/api/groups/${rally.groupId}/rally/${rally._id}/vote`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(req),
        });
        if(!res.ok){
            const data = await res.json();
            toast({
                title: "Failed to vote",
                description: data.message,
                variant: "destructive",
            });
            return;
        }


        mutate(`/api/groups/${rally.groupId}/rally`);
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
                    {rally.submissions.map((submission, index) => (
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
                    disabled={rally.userHasVoted || modalIsOpen || selectedSubmission === ownSubmission}
                >
                   {selectedSubmission === ownSubmission ? "Your Submission" : "Vote for this"}
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
                        <Button onClick={closeModal} className="absolute top-4 right-2" variant={"ghost"}>
                            <X />
                        </Button>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default RallyVoteCarousel;
