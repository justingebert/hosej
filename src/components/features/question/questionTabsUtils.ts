import type { QuestionWithUserStateDTO } from "@/types/models/question";

function getDisplayCategory(question: Pick<QuestionWithUserStateDTO, "submittedBy" | "category">) {
    if (question.submittedBy) return "Custom";
    return question.category || "Other";
}

export type FlatQuestionTabItem = {
    question: QuestionWithUserStateDTO;
    label: string;
};

// Build flat list of questions with display labels (Custom first, then others)
// Returns: [{ question, label: "Custom 1" }, { question, label: "Daily 1" }, ...]
export function buildFlatQuestionList(
    questions: QuestionWithUserStateDTO[]
): FlatQuestionTabItem[] {
    const grouped: Record<string, QuestionWithUserStateDTO[]> = {};

    for (const question of questions) {
        const category = getDisplayCategory(question);
        if (!grouped[category]) grouped[category] = [];
        grouped[category].push(question);
    }

    const categories = Object.keys(grouped).sort((a, b) => {
        if (a === "Custom") return -1;
        if (b === "Custom") return 1;
        return a.localeCompare(b);
    });

    const result: FlatQuestionTabItem[] = [];
    for (const category of categories) {
        const categoryQuestions = grouped[category];
        categoryQuestions.forEach((question, idx) => {
            result.push({
                question,
                label: categoryQuestions.length === 1 ? category : `${category} ${idx + 1}`,
            });
        });
    }

    return result;
}
