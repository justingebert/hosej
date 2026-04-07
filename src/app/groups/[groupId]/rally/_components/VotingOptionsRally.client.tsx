"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Carousel,
    type CarouselApi,
    CarouselContent,
    CarouselItem,
} from "@/components/ui/carousel";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import type { PictureSubmissionWithUrlDTO, RallyDTO } from "@/types/models/rally";
import { useAppHaptics } from "@/hooks/useAppHaptics";
import type { Session } from "next-auth";

interface RallyVoteCarouselProps {
    user: Session["user"] | undefined;
    rally: RallyDTO;
    onVote: () => void;
}

const RallyVoteCarousel = ({ user, rally, onVote }: RallyVoteCarouselProps) => {
    const { play } = useAppHaptics();
    const [selectedSubmission, setSelectedSubmission] = useState<string>("");
    const [api, setApi] = useState<CarouselApi | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const { data, isLoading } = useSWR<{ submissions: PictureSubmissionWithUrlDTO[] }>(
        `/api/groups/${rally.groupId}/rally/${rally._id}/submissions`,
        fetcher
    );

    const submissions = useMemo(() => data?.submissions || [], [data?.submissions]);

    const isOwnSubmission = useMemo(() => {
        if (!user || currentIndex < 0 || currentIndex >= submissions.length) return false;
        return submissions[currentIndex].userId === user._id;
    }, [user, currentIndex, submissions]);

    useEffect(() => {
        if (submissions.length > 0) {
            setSelectedSubmission(submissions[0]._id);
        }
    }, [submissions]);

    useEffect(() => {
        if (!api || submissions.length === 0) return;

        const onSelect = () => {
            const idx = api.selectedScrollSnap();
            setCurrentIndex(idx);
            if (idx >= 0 && idx < submissions.length) {
                setSelectedSubmission(submissions[idx]._id);
            }
        };

        api.on("select", onSelect);
        onSelect();
        return () => {
            api.off("select", onSelect);
        };
    }, [api, submissions]);

    const submitVote = async () => {
        if (!selectedSubmission || isSubmitting || isOwnSubmission) return;
        setIsSubmitting(true);

        try {
            await fetch(
                `/api/groups/${rally.groupId}/rally/${rally._id}/submissions/${selectedSubmission}/vote`,
                { method: "POST", headers: { "Content-Type": "application/json" } }
            );
            onVote();
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading || submissions.length === 0) return null;

    return (
        <div className="flex flex-col grow mt-2 pb-20">
            {/* Counter */}
            <div className="flex items-center justify-center gap-2 py-2 text-muted-foreground">
                <span className="text-sm font-medium">
                    {currentIndex + 1} / {submissions.length}
                </span>
            </div>

            {/* Dot indicators */}
            <div className="flex justify-center gap-1.5 pb-3">
                {submissions.map((_, idx) => (
                    <div
                        key={idx}
                        className={`h-1.5 rounded-full transition-all duration-200 ${
                            idx === currentIndex ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
                        }`}
                    />
                ))}
            </div>

            {/* Carousel — swipe to navigate, no arrow buttons */}
            <Carousel setApi={setApi} orientation="vertical" className="w-full">
                <CarouselContent className="h-[60dvh]">
                    {submissions.map((submission, index) => (
                        <CarouselItem key={submission._id} className="h-[60dvh]">
                            <Card className="overflow-hidden rounded-xl h-full border-0 shadow-md">
                                <CardContent className="h-full p-0 relative">
                                    <Image
                                        src={submission.imageUrl}
                                        alt={`Submission ${index + 1}`}
                                        className="object-cover w-full h-full cursor-pointer"
                                        width={600}
                                        height={600}
                                        priority={index === 0}
                                        onClick={() => {
                                            play("selection");
                                            setSelectedImage(submission.imageUrl);
                                        }}
                                    />
                                    {submission.userId === user?._id && (
                                        <Badge
                                            variant="secondary"
                                            className="absolute top-3 left-3 shadow-sm"
                                        >
                                            Your photo
                                        </Badge>
                                    )}
                                </CardContent>
                            </Card>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>

            {/* Fixed vote button at bottom */}
            <div className="fixed bottom-0 left-0 w-full p-6 bg-background pb-8">
                <Button
                    onClick={submitVote}
                    className="w-full h-12 text-base font-semibold"
                    disabled={isSubmitting || !!selectedImage || isOwnSubmission}
                >
                    {isOwnSubmission
                        ? "Can't vote on your own photo"
                        : isSubmitting
                          ? "Voting..."
                          : "Vote for this photo"}
                </Button>
            </div>

            {/* Fullscreen dialog */}
            <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
                <DialogContent className="max-w-[90vw] max-h-[90vh] p-2 bg-transparent border-none shadow-none">
                    {selectedImage && (
                        <Image
                            src={selectedImage}
                            alt="Selected Submission"
                            width={600}
                            height={600}
                            className="rounded-xl w-full h-auto"
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default RallyVoteCarousel;
