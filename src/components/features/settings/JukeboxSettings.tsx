import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";

interface JukeboxSettingsProps {
    concurrent: string[];
    activationDays: number[];
    onConcurrentChange: (value: string[]) => void;
    onActivationDaysChange: (value: number[]) => void;
}

export function JukeboxSettings({
    concurrent,
    activationDays,
    onConcurrentChange,
    onActivationDaysChange,
}: JukeboxSettingsProps) {
    const [concurrentInput, setConcurrentInput] = useState("");
    const [activationDaysInput, setActivationDaysInput] = useState("");

    useEffect(() => {
        setConcurrentInput(concurrent.join(", "));
    }, [concurrent]);

    useEffect(() => {
        setActivationDaysInput(activationDays.join(", "));
    }, [activationDays]);

    const handleConcurrentBlur = () => {
        const parsed = concurrentInput
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
        onConcurrentChange(parsed);
        setConcurrentInput(parsed.join(", "));
    };

    const handleActivationDaysBlur = () => {
        const parsed = (activationDaysInput || "")
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s !== "")
            .map((n) => Number(n))
            .filter((n) => !Number.isNaN(n))
            .filter((n) => n >= 1 && n <= 31);
        onActivationDaysChange(parsed);
        setActivationDaysInput(parsed.join(", "));
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="jukebox-concurrent">Concurrent (comma-separated)</Label>
                <Input
                    id="jukebox-concurrent"
                    type="text"
                    placeholder="e.g. Jukebox, AnotherFeature"
                    value={concurrentInput}
                    onChange={(e) => setConcurrentInput(e.target.value)}
                    onBlur={handleConcurrentBlur}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            handleConcurrentBlur();
                        }
                    }}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="jukebox-activation-days">
                    Activation Days (day of month, comma-separated)
                </Label>
                <Input
                    id="jukebox-activation-days"
                    type="text"
                    placeholder="e.g. 1, 3, 5"
                    value={activationDaysInput}
                    onChange={(e) => setActivationDaysInput(e.target.value)}
                    onBlur={handleActivationDaysBlur}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            handleActivationDaysBlur();
                        }
                    }}
                />
                <p className="text-xs text-muted-foreground">Use numbers 1-31</p>
            </div>
        </div>
    );
}
