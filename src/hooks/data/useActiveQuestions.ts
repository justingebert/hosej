import useSWR, { mutate as globalMutate } from "swr";
import fetcher from "@/lib/fetcher";
import type { QuestionWithUserStateDTO, UserRating } from "@/types/models/question";

export type CreateQuestionPayload = Record<string, unknown>;

export type AttachQuestionOption = { key: string; url: string };

type ActiveQuestionsResponse = {
    questions: QuestionWithUserStateDTO[];
    completionPercentage?: number;
};

const activeQuestionsKey = (groupId: string | null | undefined) =>
    groupId ? `/api/groups/${groupId}/question` : null;

async function revalidateActiveQuestions(groupId: string | null | undefined) {
    const key = activeQuestionsKey(groupId);
    if (!key) throw new Error("groupId is required");
    await globalMutate(key);
}

export function useQuestionActions(groupId: string | null | undefined) {
    const revalidateQuestions = async () => {
        await revalidateActiveQuestions(groupId);
    };

    const createQuestion = async (
        payload: CreateQuestionPayload
    ): Promise<{ _id: string } & Record<string, unknown>> => {
        if (!groupId) throw new Error("groupId is required");
        const res = await fetch(`/api/groups/${groupId}/question`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const info = await res.json().catch(() => ({}));
            throw new Error(info.message || "Failed to create question");
        }
        const { newQuestion } = await res.json();
        await revalidateQuestions();
        return newQuestion;
    };

    const attachQuestionImage = async (questionId: string, imageKey: string) => {
        if (!groupId) throw new Error("groupId is required");
        const res = await fetch(`/api/groups/${groupId}/question/${questionId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageKey }),
        });
        if (!res.ok) {
            const info = await res.json().catch(() => ({}));
            throw new Error(info.message || "Failed to attach image");
        }
        await revalidateQuestions();
    };

    const attachQuestionOptions = async (questionId: string, options: AttachQuestionOption[]) => {
        if (!groupId) throw new Error("groupId is required");
        const res = await fetch(`/api/groups/${groupId}/question/${questionId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ options }),
        });
        if (!res.ok) {
            const info = await res.json().catch(() => ({}));
            throw new Error(info.message || "Failed to attach options");
        }
        await revalidateQuestions();
    };

    const voteQuestion = async (
        questionId: string,
        response: string | string[] | Record<string, string>
    ) => {
        if (!groupId) throw new Error("groupId is required");
        const res = await fetch(`/api/groups/${groupId}/question/${questionId}/vote`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ response }),
        });
        if (!res.ok) {
            const info = await res.json().catch(() => ({}));
            throw new Error(info.message || "Failed to submit vote");
        }
        await revalidateQuestions();
    };

    const rateQuestion = async (questionId: string, rating: Exclude<UserRating, null>) => {
        if (!groupId) throw new Error("groupId is required");
        const res = await fetch(`/api/groups/${groupId}/question/${questionId}/rate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rating }),
        });
        if (!res.ok) {
            const info = await res.json().catch(() => ({}));
            throw new Error(info.message || "Failed to rate question");
        }
        await revalidateQuestions();
    };

    return {
        revalidateQuestions,
        createQuestion,
        attachQuestionImage,
        attachQuestionOptions,
        voteQuestion,
        rateQuestion,
    };
}

export function useActiveQuestions(groupId: string | null | undefined) {
    const key = activeQuestionsKey(groupId);
    const { data, error, isLoading, mutate } = useSWR<ActiveQuestionsResponse>(key, fetcher);
    const actions = useQuestionActions(groupId);

    return {
        questions: data?.questions ?? [],
        completionPercentage: data?.completionPercentage,
        isLoading,
        error,
        mutate,
        ...actions,
    };
}
