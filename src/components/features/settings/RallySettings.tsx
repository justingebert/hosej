import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface RallySettingsProps {
    rallyCount: number;
    rallyGapDays: number;
    onRallyCountChange: (value: number) => void;
    onRallyGapDaysChange: (value: number) => void;
}

export function RallySettings({
    rallyCount,
    rallyGapDays,
    onRallyCountChange,
    onRallyGapDaysChange,
}: RallySettingsProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <Label htmlFor="rallyCount">Rally Count</Label>
                <Input
                    id="rallyCount"
                    type="number"
                    pattern="\d*"
                    name="rallyCount"
                    value={rallyCount || ""}
                    onChange={(e) => onRallyCountChange(Number(e.target.value))}
                    className="w-20 text-center"
                />
            </div>
            <div className="flex items-center justify-between gap-4">
                <Label htmlFor="rallyGapDays">Rally Gap Days</Label>
                <Input
                    id="rallyGapDays"
                    type="number"
                    pattern="\d*"
                    name="rallyGapDays"
                    value={rallyGapDays || ""}
                    onChange={(e) => onRallyGapDaysChange(Number(e.target.value))}
                    className="w-20 text-center"
                />
            </div>
        </div>
    );
}
