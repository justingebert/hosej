import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface QuestionSettingsProps {
    questionCount: number;
    lastQuestionDate: string | null;
    onQuestionCountChange: (value: number) => void;
}

export function QuestionSettings({
    questionCount,
    lastQuestionDate,
    onQuestionCountChange,
}: QuestionSettingsProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <Label htmlFor="questionCount">Question Count</Label>
                <Input
                    id="questionCount"
                    type="number"
                    pattern="\d*"
                    name="questionCount"
                    value={questionCount || ""}
                    onChange={(e) => onQuestionCountChange(Number(e.target.value))}
                    className="w-20 text-center"
                />
            </div>
            <div className="text-sm text-muted-foreground">
                Last Question Date:{" "}
                {lastQuestionDate ? new Date(lastQuestionDate).toLocaleDateString() : "N/A"}
            </div>
        </div>
    );
}
