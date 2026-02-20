import { describe, expect, it } from "vitest";
import { QuestionType } from "@/types/models/question";
import type { QuestionWithUserStateDTO } from "@/types/models/question";
import { buildFlatQuestionList } from "@/components/features/question/questionTabsUtils";

function makeQuestion(
    overrides: Partial<QuestionWithUserStateDTO> & Pick<QuestionWithUserStateDTO, "_id">
): QuestionWithUserStateDTO {
    return {
        _id: overrides._id,
        groupId: "g1",
        category: "Daily",
        questionType: QuestionType.CustomSelectOne,
        question: "Q",
        answers: [],
        rating: { good: [], ok: [], bad: [] },
        used: true,
        active: true,
        createdAt: new Date(0).toISOString(),
        userHasVoted: false,
        userRating: null,
        ...overrides,
    };
}

describe("questionTabsUtils", () => {
    it("groups by category and puts Custom first", () => {
        const questions = [
            makeQuestion({ _id: "b", category: "B" }),
            makeQuestion({ _id: "c", submittedBy: "u1", category: "Z" }),
            makeQuestion({ _id: "a", category: "A" }),
        ];

        const flat = buildFlatQuestionList(questions);
        expect(flat.map((i) => i.label)).toEqual(["Custom", "A", "B"]);
        expect(flat.map((i) => i.question._id)).toEqual(["c", "a", "b"]);
    });

    it("numbers categories with multiple questions", () => {
        const questions = [
            makeQuestion({ _id: "d1", category: "Daily" }),
            makeQuestion({ _id: "d2", category: "Daily" }),
        ];

        const flat = buildFlatQuestionList(questions);
        expect(flat.map((i) => i.label)).toEqual(["Daily 1", "Daily 2"]);
    });
});
