import { Camera, CirclePlay, Info, PlusCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface EmptyRallyGuideProps {
    groupId: string;
    userIsAdmin: boolean;
    onActivate: () => void;
}

export function EmptyRallyGuide({ groupId, userIsAdmin, onActivate }: EmptyRallyGuideProps) {
    return (
        <div className="flex-grow flex flex-col items-center justify-center pb-32 px-6">
            <div className="flex flex-col items-center space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="relative">
                    <div className="w-24 h-24 rounded-full from-background to-muted/50 border flex items-center justify-center relative">
                        <Camera className="w-10 h-10 text-muted-foreground/60" />
                    </div>
                </div>

                <div className="text-center space-y-2 relative z-10">
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground/80">
                        No active rallies
                    </h2>
                    <p className="text-sm text-muted-foreground/60 max-w-[260px] leading-relaxed mx-auto">
                        Group admins control when rallies start and how many active rallies run at
                        once.
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
                        <span className="font-semibold text-base">Start Rally now</span>
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
                        Create new Rally
                    </Button>
                </Link>

                <div className="mt-4 w-full">
                    <Link href={`/groups/${groupId}/info`} className="w-full block" prefetch={true}>
                        <Button
                            variant="ghost"
                            className="w-full rounded-2xl h-12 text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-all flex items-center justify-center opacity-80 hover:opacity-100"
                        >
                            <Info className="w-4 h-4 mr-2" />
                            <span className="font-medium text-sm">How Rallies Work</span>
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
