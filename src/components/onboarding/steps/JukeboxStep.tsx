"use client";

import { useState } from "react";
import { Music, Star } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

function ratingColor(value: number) {
    if (value <= 33) return "bg-red-500/20 text-red-600";
    if (value <= 66) return "bg-orange-500/20 text-orange-600";
    return "bg-green-500/20 text-green-600";
}

export function JukeboxStep() {
    const [rating, setRating] = useState(50);

    return (
        <div className="flex flex-col gap-4 py-2">
            <div>
                <h2 className="text-lg font-bold mb-1">Jukebox</h2>
                <p className="text-sm text-muted-foreground">
                    Share music with your group and rate each other&apos;s picks!
                </p>
            </div>

            <div className="rounded-xl bg-secondary/30 p-4">
                {/* Mock song card */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Music className="h-7 w-7 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">Bohemian Rhapsody</p>
                        <p className="text-xs text-muted-foreground truncate">Queen</p>
                    </div>
                    <Badge className={`${ratingColor(rating)} border-0 font-bold`}>{rating}</Badge>
                </div>

                {/* Interactive rating */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Try rating this song!</span>
                    </div>
                    <Slider
                        value={[rating]}
                        onValueChange={([v]) => setRating(v)}
                        min={0}
                        max={100}
                        step={1}
                        className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>0</span>
                        <span>50</span>
                        <span>100</span>
                    </div>
                </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
                Share your current favorite or recommended songs with your group, and see what
                everyone thinks of them.
            </p>
        </div>
    );
}
