import { MessageSquare, PlusCircle, CirclePlay } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface EmptyQuestionGuideProps {
    groupId: string;
    userIsAdmin: boolean;
    onActivate: () => void;
}

export function EmptyQuestionGuide({ groupId, userIsAdmin, onActivate }: EmptyQuestionGuideProps) {
    return (
        <div className="flex-grow flex flex-col items-center justify-center pb-32 px-6">
            <div className="flex flex-col items-center space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-background to-muted/50 border border-white/10 backdrop-blur-md flex items-center justify-center relative shadow-inner">
                        <MessageSquare className="w-10 h-10 text-muted-foreground/60" />
                    </div>
                </div>

                <div className="text-center space-y-2 relative z-10">
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground/80">
                        No active questions
                    </h2>
                    <p className="text-sm text-muted-foreground/60 max-w-[280px] leading-relaxed mx-auto">
                        All members can create new questions, or the group admin can easily add
                        question packs.
                    </p>
                </div>
            </div>

            <div className="mt-12 flex flex-col items-center gap-3 w-full max-w-xs animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both relative z-10">
                {userIsAdmin && (
                    <Button
                        className="w-full rounded-2xl h-14 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        onClick={onActivate}
                    >
                        <CirclePlay className="w-5 h-5 mr-3" />
                        <span className="font-semibold text-base">Activate Next Question</span>
                    </Button>
                )}

                <Link href={`/groups/${groupId}/create`} className="w-full block" prefetch={true}>
                    <Button
                        variant={userIsAdmin ? "secondary" : "default"}
                        className={`w-full rounded-2xl h-14 transition-all hover:scale-[1.02] active:scale-[0.98] font-semibold text-base ${
                            !userIsAdmin
                                ? "shadow-lg shadow-primary/20 font-semibold text-base"
                                : "bg-secondary/50 hover:bg-secondary/80 backdrop-blur-sm shadow-sm"
                        }`}
                    >
                        <PlusCircle className="w-5 h-5 mr-3" />
                        Go to Create
                    </Button>
                </Link>
            </div>
        </div>
    );
}
