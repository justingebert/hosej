import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import type { QuestionDTO, QuestionOptionDTO, QuestionResultsDTO } from "@/types/models/question";

export type QuestionDetailsDTO = Omit<QuestionDTO, "options"> & { options?: QuestionOptionDTO[] };

export function useQuestionDetails(
    groupId: string | null | undefined,
    questionId: string | null | undefined
) {
    const key = groupId && questionId ? `/api/groups/${groupId}/question/${questionId}` : null;
    const { data, error, isLoading, mutate } = useSWR<QuestionDetailsDTO>(key, fetcher);

    return { question: data, isLoading, error, mutate };
}

export function useQuestionResults(
    groupId: string | null | undefined,
    questionId: string | null | undefined
) {
    const key =
        groupId && questionId ? `/api/groups/${groupId}/question/${questionId}/results` : null;
    const { data, error, isLoading, mutate } = useSWR<QuestionResultsDTO>(key, fetcher);

    return { results: data, isLoading, error, mutate };
}
