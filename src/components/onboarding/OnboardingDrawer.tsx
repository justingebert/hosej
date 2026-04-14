"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { StepIndicator } from "./StepIndicator";
import { WelcomeStep } from "./steps/WelcomeStep";
import { CustomVotingStep } from "./steps/CustomVotingStep";
import { RallyStep } from "./steps/RallyStep";
import { JukeboxStep } from "./steps/JukeboxStep";
import { CreateStep } from "./steps/CreateStep";
import { ChatStep } from "./steps/ChatStep";
import { HistoryStatsStep } from "./steps/HistoryStatsStep";
import { ChevronRight } from "lucide-react";

const STEPS = [
    WelcomeStep,
    CustomVotingStep,
    RallyStep,
    JukeboxStep,
    CreateStep,
    ChatStep,
    HistoryStatsStep,
];

type BodyProps = {
    step: number;
    direction: number;
    completing: boolean;
    onNext: () => void;
    onBack: () => void;
    onSkip: () => void;
};

function OnboardingBody({ step, direction, completing, onNext, onBack, onSkip }: BodyProps) {
    const totalSteps = STEPS.length;
    const isLastStep = step === totalSteps - 1;
    const CurrentStep = STEPS[step];

    return (
        <div className="flex flex-col flex-1 min-h-0">
            {/* Step indicator + Skip */}
            <div className="px-4 pt-2 pb-1 flex items-center justify-between shrink-0">
                <div className="flex-1">
                    <StepIndicator totalSteps={totalSteps} currentStep={step} />
                </div>
                <button
                    onClick={onSkip}
                    disabled={completing}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-3 shrink-0"
                >
                    Skip
                </button>
            </div>

            {/* Step content */}
            <div className="flex-1 overflow-y-auto px-6 pb-2 min-h-0">
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: direction * 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: direction * -30 }}
                        transition={{ duration: 0.2 }}
                    >
                        <CurrentStep />
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation footer */}
            <div className="flex-row flex gap-3 px-4 pt-2 pb-6 shrink-0">
                {step > 0 ? (
                    <Button variant="outline" className="flex-1" onClick={onBack}>
                        Back
                    </Button>
                ) : (
                    <div className="flex-1" />
                )}
                <Button
                    className={`flex-1 ${isLastStep ? "bg-accent" : ""}`}
                    onClick={onNext}
                    disabled={completing}
                >
                    {completing ? "..." : isLastStep ? "Get Started" : "Next"}
                    <ChevronRight size={15} />
                </Button>
            </div>
        </div>
    );
}

export function OnboardingDrawer({
    onClose,
    replay = false,
}: { onClose?: () => void; replay?: boolean } = {}) {
    const { update } = useSession();
    const { toast } = useToast();
    const [open, setOpen] = useState(true);
    const [step, setStep] = useState(0);
    const [direction, setDirection] = useState(1);
    const [completing, setCompleting] = useState(false);
    const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(min-width: 640px)");
        const sync = (event?: MediaQueryListEvent) => {
            setIsDesktop(event?.matches ?? mediaQuery.matches);
        };
        sync();
        mediaQuery.addEventListener("change", sync);
        return () => mediaQuery.removeEventListener("change", sync);
    }, []);

    const totalSteps = STEPS.length;
    const isLastStep = step === totalSteps - 1;

    const closeDrawer = () => {
        setOpen(false);
        onClose?.();
    };

    //TODO this shound throw erropr for user
    const completeOnboarding = async () => {
        if (completing) return;

        // Replay mode (e.g. from /help): no persistence needed — just close.
        if (replay) {
            closeDrawer();
            return;
        }

        setCompleting(true);
        try {
            const res = await fetch("/api/users", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ onboardingCompleted: true }),
            });
            if (!res.ok) throw new Error(`Request failed: ${res.status}`);
            await update();
            closeDrawer();
        } catch {
            toast({
                title: "Couldn't save progress",
                description: "Please try again.",
                variant: "destructive",
            });
        } finally {
            setCompleting(false);
        }
    };

    const goNext = () => {
        if (isLastStep) {
            completeOnboarding();
        } else {
            setDirection(1);
            setStep((s) => Math.min(totalSteps - 1, s + 1));
        }
    };

    const goBack = () => {
        setDirection(-1);
        setStep((s) => Math.max(0, s - 1));
    };

    // Avoid SSR/hydration flash — wait until we know the breakpoint
    if (isDesktop === null) return null;

    const body = (
        <OnboardingBody
            step={step}
            direction={direction}
            completing={completing}
            onNext={goNext}
            onBack={goBack}
            onSkip={completeOnboarding}
        />
    );

    if (isDesktop) {
        return (
            <Dialog
                open={open}
                onOpenChange={(next) => {
                    if (next) return;
                    if (replay) closeDrawer();
                    else void completeOnboarding();
                }}
            >
                <DialogContent
                    className="max-w-md w-full max-h-[85dvh] flex flex-col p-0 gap-0 [&>button]:hidden"
                    onEscapeKeyDown={(e) => {
                        if (!replay) e.preventDefault();
                    }}
                    onPointerDownOutside={(e) => {
                        if (!replay) e.preventDefault();
                    }}
                    onInteractOutside={(e) => {
                        if (!replay) e.preventDefault();
                    }}
                >
                    <DialogTitle className="sr-only">Welcome to HoseJ</DialogTitle>
                    <DialogDescription className="sr-only">
                        Interactive onboarding walkthrough
                    </DialogDescription>
                    {body}
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Drawer
            open={open}
            dismissible={replay}
            onOpenChange={(next) => {
                if (!next && replay) closeDrawer();
            }}
        >
            <DrawerContent className="max-h-[85dvh] focus:outline-none">
                <DrawerTitle className="sr-only">Welcome to HoseJ</DrawerTitle>
                <DrawerDescription className="sr-only">
                    Interactive onboarding walkthrough
                </DrawerDescription>
                {body}
            </DrawerContent>
        </Drawer>
    );
}
