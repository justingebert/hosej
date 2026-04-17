"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowRight, Star, ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils/utils";
import type { FeedbackInput } from "@/lib/announcements/registry";
import type { ResolvedAnnouncement } from "@/lib/announcements/resolve";

type Props = {
    announcement: ResolvedAnnouncement;
    onDismiss: () => void;
};

type ResponseValue = string | number | boolean;

function isResponseFilled(input: FeedbackInput, value: ResponseValue | undefined): boolean {
    if (value === undefined || value === null) return false;
    if (input.kind === "text") return typeof value === "string" && value.trim().length > 0;
    if (input.kind === "choice") return typeof value === "string" && value.length > 0;
    if (input.kind === "thumbs") return typeof value === "boolean";
    if (input.kind === "stars") return typeof value === "number" && value >= 1 && value <= 5;
    return false;
}

export function AnnouncementDrawer({ announcement, onDismiss }: Props) {
    const { update } = useSession();
    const { toast } = useToast();
    const [open, setOpen] = useState(true);
    const [isDesktop, setIsDesktop] = useState<boolean | null>(null);
    const [dismissing, setDismissing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [responses, setResponses] = useState<Record<string, ResponseValue>>({});

    useEffect(() => {
        const mediaQuery = window.matchMedia("(min-width: 640px)");
        const sync = (event?: MediaQueryListEvent) => {
            setIsDesktop(event?.matches ?? mediaQuery.matches);
        };
        sync();
        mediaQuery.addEventListener("change", sync);
        return () => mediaQuery.removeEventListener("change", sync);
    }, []);

    const markSeen = async () => {
        if (dismissing) return;
        setDismissing(true);
        try {
            const res = await fetch("/api/users", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ announcementsSeen: [announcement.id] }),
            });
            if (!res.ok) throw new Error(`Request failed: ${res.status}`);
            await update();
            setOpen(false);
            onDismiss();
        } catch {
            toast({
                title: "Couldn't dismiss",
                description: "Please try again.",
                variant: "destructive",
            });
            setDismissing(false);
        }
    };

    const submitFeedback = async () => {
        if (submitting || announcement.kind !== "feedback") return;
        setSubmitting(true);
        try {
            const res = await fetch(`/api/announcements/${announcement.id}/feedback`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ responses }),
            });
            if (!res.ok) throw new Error(`Request failed: ${res.status}`);
            await update();
            setOpen(false);
            onDismiss();
        } catch {
            toast({
                title: "Couldn't submit feedback",
                description: "Please try again.",
                variant: "destructive",
            });
            setSubmitting(false);
        }
    };

    const canSubmit = useMemo(() => {
        if (announcement.kind !== "feedback") return false;
        return announcement.inputs.every(
            (input) => input.optional || isResponseFilled(input, responses[input.id])
        );
    }, [announcement, responses]);

    if (isDesktop === null) return null;

    const header = (
        <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">{announcement.title}</h2>
            <p className="text-sm text-muted-foreground">{announcement.body}</p>
        </div>
    );

    let content: React.ReactNode;

    if (announcement.kind === "cta") {
        content = (
            <div className="flex flex-col gap-4 p-6">
                {header}
                <div className="flex flex-col gap-2 pt-2">
                    <Button asChild className="w-full" onClick={() => void markSeen()}>
                        <Link href={announcement.cta.href} transitionTypes={["drill-forward"]}>
                            {announcement.cta.label}
                            <ArrowRight size={15} className="ml-1" />
                        </Link>
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => void markSeen()}
                        disabled={dismissing}
                    >
                        Not now
                    </Button>
                </div>
            </div>
        );
    } else if (announcement.kind === "feedback") {
        content = (
            <div className="flex flex-col gap-4 p-6">
                {header}
                <div className="flex flex-col gap-4 pt-2">
                    {announcement.inputs.map((input) => (
                        <div key={input.id} className="flex flex-col gap-2">
                            <label className="text-sm font-medium">{input.prompt}</label>
                            {input.kind === "choice" && (
                                <div className="flex flex-wrap gap-2">
                                    {input.options.map((opt) => {
                                        const selected = responses[input.id] === opt.value;
                                        return (
                                            <Button
                                                key={opt.value}
                                                type="button"
                                                variant={selected ? "default" : "outline"}
                                                onClick={() =>
                                                    setResponses((prev) => ({
                                                        ...prev,
                                                        [input.id]: opt.value,
                                                    }))
                                                }
                                            >
                                                {opt.label}
                                            </Button>
                                        );
                                    })}
                                </div>
                            )}
                            {input.kind === "thumbs" && (
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant={
                                            responses[input.id] === true ? "default" : "outline"
                                        }
                                        onClick={() =>
                                            setResponses((prev) => ({
                                                ...prev,
                                                [input.id]: true,
                                            }))
                                        }
                                        aria-label="Thumbs up"
                                    >
                                        <ThumbsUp size={16} />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={
                                            responses[input.id] === false ? "default" : "outline"
                                        }
                                        onClick={() =>
                                            setResponses((prev) => ({
                                                ...prev,
                                                [input.id]: false,
                                            }))
                                        }
                                        aria-label="Thumbs down"
                                    >
                                        <ThumbsDown size={16} />
                                    </Button>
                                </div>
                            )}
                            {input.kind === "stars" && (
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((n) => {
                                        const current = responses[input.id];
                                        const active = typeof current === "number" && n <= current;
                                        return (
                                            <button
                                                key={n}
                                                type="button"
                                                aria-label={`${n} star${n === 1 ? "" : "s"}`}
                                                onClick={() =>
                                                    setResponses((prev) => ({
                                                        ...prev,
                                                        [input.id]: n,
                                                    }))
                                                }
                                                className="p-1"
                                            >
                                                <Star
                                                    size={24}
                                                    className={cn(
                                                        "transition-colors",
                                                        active
                                                            ? "fill-primary stroke-primary"
                                                            : "stroke-muted-foreground"
                                                    )}
                                                />
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                            {input.kind === "text" && (
                                <Textarea
                                    value={
                                        typeof responses[input.id] === "string"
                                            ? (responses[input.id] as string)
                                            : ""
                                    }
                                    placeholder={input.placeholder}
                                    maxLength={input.maxLength}
                                    onChange={(e) =>
                                        setResponses((prev) => ({
                                            ...prev,
                                            [input.id]: e.target.value,
                                        }))
                                    }
                                />
                            )}
                        </div>
                    ))}
                </div>
                <div className="flex flex-col gap-2 pt-2">
                    <Button
                        className="w-full"
                        onClick={() => void submitFeedback()}
                        disabled={!canSubmit || submitting}
                    >
                        Submit
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => void markSeen()}
                        disabled={dismissing}
                    >
                        Not now
                    </Button>
                </div>
            </div>
        );
    } else {
        content = (
            <div className="flex flex-col gap-4 p-6">
                {header}
                <div className="flex flex-col gap-2 pt-2">
                    <Button
                        className="w-full"
                        onClick={() => void markSeen()}
                        disabled={dismissing}
                    >
                        Got it
                    </Button>
                </div>
            </div>
        );
    }

    if (isDesktop) {
        return (
            <Dialog
                open={open}
                onOpenChange={(next) => {
                    if (!next) void markSeen();
                }}
            >
                <DialogContent className="max-w-md w-full p-0 gap-0">
                    <DialogTitle className="sr-only">{announcement.title}</DialogTitle>
                    <DialogDescription className="sr-only">{announcement.body}</DialogDescription>
                    {content}
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Drawer
            open={open}
            onOpenChange={(next) => {
                if (!next) void markSeen();
            }}
        >
            <DrawerContent className="focus:outline-none">
                <DrawerTitle className="sr-only">{announcement.title}</DrawerTitle>
                <DrawerDescription className="sr-only">{announcement.body}</DrawerDescription>
                {content}
            </DrawerContent>
        </Drawer>
    );
}
