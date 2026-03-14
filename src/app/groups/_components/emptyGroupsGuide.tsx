import { ArrowDown, Share, Star, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function EmptyGroupsGuide() {
    return (
        <div className="flex-grow flex flex-col items-center justify-center pb-32 px-6">
            <div className="flex flex-col items-center space-y-4 text-muted-foreground/50">
                <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center">
                    <Users className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-semibold tracking-tight text-muted-foreground/60">
                    No groups yet
                </h2>
                <p className="text-center text-sm text-muted-foreground/40 max-w-xs leading-relaxed">
                    Get started by creating your own group or joining an existing one with a group
                    ID
                </p>
            </div>

            <div className="mt-12 w-full max-w-xs relative group">
                <Card className="border-dashed border-2 border-muted-foreground/20 bg-gradient-to-br from-background to-muted/30 shadow-sm rounded-2xl">
                    <CardContent className="flex justify-between items-center p-5">
                        <div className="flex flex-col gap-1">
                            <CardTitle className="text-muted-foreground/40 text-xl tracking-tight">
                                My Group
                            </CardTitle>
                            <CardDescription className="text-muted-foreground/30 text-sm">
                                Go Vote Now!
                            </CardDescription>
                        </div>
                        <div className="flex items-center space-x-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                disabled
                                className="opacity-30 rounded-full"
                            >
                                <Star className="w-5 h-5" />
                            </Button>
                            <div className="relative">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled
                                    className="opacity-30 rounded-full"
                                >
                                    <Share className="w-4 h-4" />
                                </Button>
                                <div className="absolute -top-10 -left-1/4 -translate-x-1/2 flex flex-col items-center animate-bounce">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary/60 whitespace-nowrap bg-primary/10 px-2 py-0.5 rounded-full mb-1">
                                        Share ID
                                    </span>
                                    <ArrowDown className="w-4 h-4 text-primary/40 -mt-1" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-16 flex w-full max-w-sm justify-between px-8 relative">
                <div className="flex flex-col items-center space-y-2 opacity-60 hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Start fresh
                    </span>
                    <ArrowDown className="w-5 h-5 text-muted-foreground animate-bounce" />
                </div>
                <div className="flex flex-col items-center space-y-2 opacity-60 hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Have a code?
                    </span>
                    <ArrowDown className="w-5 h-5 text-muted-foreground animate-bounce" />
                </div>
            </div>
        </div>
    );
}
