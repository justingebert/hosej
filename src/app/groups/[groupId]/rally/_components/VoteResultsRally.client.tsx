"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRallySubmissions } from "@/hooks/data/useRallySubmissions";
import { RallyVotesChart } from "@/app/groups/[groupId]/rally/_components/RallyResultsChart";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import ChatComponent from "@/components/common/Chat";
import { Heart } from "lucide-react";
import type { Session } from "next-auth";
import type { RallyDTO } from "@/types/models/rally";

interface RallyResultsProps {
    user: Session["user"] | undefined;
    rally: RallyDTO;
}

const MEDALS = ["🥇", "🥈", "🥉"];

const RallyResults = ({ user, rally }: RallyResultsProps) => {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const { submissions } = useRallySubmissions(rally.groupId, rally._id);

    if (submissions.length === 0) return null;

    return (
        <div className="mt-2">
            {/* Chart */}
            {submissions.length > 1 && (
                <div className="mb-6">
                    <RallyVotesChart submissions={submissions} />
                </div>
            )}

            {/* Submission cards */}
            <div className="flex flex-col gap-4 mb-5">
                {submissions.map((submission, index) => (
                    <Card
                        key={submission._id}
                        className={`overflow-hidden ${index === 0 && submissions.length > 1 ? "ring-2 ring-primary/20" : ""}`}
                    >
                        <div className="flex items-center justify-between px-4 pt-3 pb-2">
                            <div className="flex items-center gap-2.5">
                                <Avatar className="h-8 w-8">
                                    {submission.avatarUrl && (
                                        <AvatarImage
                                            src={submission.avatarUrl}
                                            alt={submission.username}
                                        />
                                    )}
                                    <AvatarFallback className="text-sm">
                                        {submission.username[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-sm">{submission.username}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 text-muted-foreground">
                                    <Heart className="h-3.5 w-3.5" />
                                    <span className="text-sm font-medium">
                                        {submission.votes.length}
                                    </span>
                                </div>
                                {index < 3 && submissions.length > 1 && (
                                    <span className="text-lg">{MEDALS[index]}</span>
                                )}
                            </div>
                        </div>
                        <CardContent className="p-0">
                            <Image
                                src={submission.imageUrl}
                                alt={`Submission by ${submission.username}`}
                                className="object-cover w-full h-auto cursor-pointer"
                                width={600}
                                height={600}
                                priority={index === 0}
                                onClick={() => setSelectedImage(submission.imageUrl)}
                            />
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Separator className="my-4" />
            {user && <ChatComponent user={user} entity={rally} available={true} />}

            {/* Fullscreen image dialog */}
            <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
                <DialogContent className="max-w-[90vw] max-h-[90vh] p-2 bg-transparent border-none shadow-none">
                    {selectedImage && (
                        <Image
                            src={selectedImage}
                            alt="Full size"
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

export default RallyResults;
