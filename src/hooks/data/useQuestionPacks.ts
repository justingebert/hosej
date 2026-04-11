import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import type { QuestionPackDTO } from "@/types/models/questionPack";

export type PackWithStatus = QuestionPackDTO & { added: boolean };

export function useQuestionPacks(groupId: string | null | undefined) {
    const key = groupId ? `/api/groups/${groupId}/question-packs` : null;
    const { data, error, isLoading, mutate } = useSWR<PackWithStatus[]>(key, fetcher);

    const addPackToGroup = async (packId: string) => {
        if (!groupId) throw new Error("groupId is required");
        const res = await fetch(`/api/groups/${groupId}/question-packs`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ packId }),
        });
        if (!res.ok) {
            const info = await res.json().catch(() => ({}));
            throw new Error(info.message || "Failed to add pack");
        }
        await mutate();
    };

    return { packs: data ?? [], isLoading, error, mutate, addPackToGroup };
}
