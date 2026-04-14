"use client";

import Header from "@/components/ui/custom/Header";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import BackLink from "@/components/ui/custom/BackLink";
import PWAInstallButton from "@/components/common/PWAInstallButton";
import { OnboardingDrawer } from "@/components/onboarding/OnboardingDrawer";
import { Bug, BookOpenText } from "lucide-react";
import { useState } from "react";

const FEEDBACK_EMAIL = "pregame_acid_9o@icloud.com";

export default function HelpPage() {
    const [showTutorial, setShowTutorial] = useState(false);

    const handleBugReport = () => {
        const ua = typeof navigator !== "undefined" ? navigator.userAgent : "unknown";
        const subject = encodeURIComponent("HoseJ — Bug report");
        const body = encodeURIComponent(
            [
                "Describe the bug:",
                "",
                "",
                "Steps to reproduce:",
                "1. ",
                "2. ",
                "",
                "Expected vs. actual:",
                "",
                "---",
                `Device: ${ua}`,
            ].join("\n")
        );
        window.location.href = `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;
    };

    return (
        <div className="flex flex-col h-full">
            <Header leftComponent={<BackLink href={`/groups`} />} title={"Help"} />

            <div className="mx-auto flex w-full max-w-sm flex-1 flex-col">
                <div className="flex flex-col items-center gap-4">
                    <p className="text-center text-muted-foreground text-sm">
                        This is a private app in development
                    </p>

                    <Image
                        src="/cat.jpg"
                        alt="cat"
                        width={500}
                        height={500}
                        className="rounded-xl"
                        priority
                    />

                    <PWAInstallButton className="w-full bg-accent" />

                    <Button
                        variant="secondary"
                        className="w-full"
                        onClick={() => setShowTutorial(true)}
                    >
                        <BookOpenText className="h-4 w-4 mr-2" />
                        Show Tutorial
                    </Button>

                    <Button variant="destructive" className="w-full" onClick={handleBugReport}>
                        <Bug className="h-4 w-4 mr-2" />
                        Report a Bug
                    </Button>
                </div>

                <div className="mt-auto flex gap-4 w-full pb-1">
                    <Link href="/terms" className="flex-1">
                        <Button variant="secondary" className="w-full">
                            Terms of Service
                        </Button>
                    </Link>
                    <Link href="/privacy" className="flex-1">
                        <Button variant="secondary" className="w-full">
                            Privacy Policy
                        </Button>
                    </Link>
                </div>
            </div>

            {showTutorial && <OnboardingDrawer replay onClose={() => setShowTutorial(false)} />}
        </div>
    );
}
