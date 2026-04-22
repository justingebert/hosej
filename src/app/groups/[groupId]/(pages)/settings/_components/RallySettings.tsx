import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/utils";

interface RallySettingsProps {
    rallyCount: number;
    rallyGapDays: number;
    onRallyCountChange: (value: number) => void;
    onRallyGapDaysChange: (value: number) => void;
}

const COUNT_CHOICES = [1, 2, 3];

export function RallySettings({
    rallyCount,
    rallyGapDays,
    onRallyCountChange,
    onRallyGapDaysChange,
}: RallySettingsProps) {
    return (
        <div className="space-y-4">
            <div className="space-y-1">
                <div className="flex items-center justify-between gap-4">
                    <Label>Concurrent Rallies</Label>
                    <div className="inline-flex rounded-md border border-input overflow-hidden">
                        {COUNT_CHOICES.map((n, idx) => {
                            const selected = rallyCount === n;
                            return (
                                <button
                                    key={n}
                                    type="button"
                                    onClick={() => onRallyCountChange(n)}
                                    aria-pressed={selected}
                                    className={cn(
                                        "h-9 w-10 text-sm font-medium transition-colors",
                                        idx > 0 && "border-l border-input",
                                        selected
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-background hover:bg-accent"
                                    )}
                                >
                                    {n}
                                </button>
                            );
                        })}
                    </div>
                </div>
                <p className="text-xs text-muted-foreground">
                    How many rallies run at the same time.
                </p>
            </div>

            <div className="space-y-1">
                <div className="flex items-center justify-between gap-4">
                    <Label htmlFor="rallyGapDays">Gap Between Rallies</Label>
                    <Input
                        id="rallyGapDays"
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={90}
                        name="rallyGapDays"
                        value={rallyGapDays || ""}
                        onChange={(e) => onRallyGapDaysChange(Number(e.target.value))}
                        className="w-20 text-center"
                    />
                </div>
                <p className="text-xs text-muted-foreground">
                    After a Rally ends, how many days it takes for the next one to start.
                </p>
            </div>
        </div>
    );
}
