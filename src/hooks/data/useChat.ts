import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import type { ChatDTO } from "@/types/models/chat";

export function useChat(groupId: string | null | undefined, chatId: string | null | undefined) {
    const key = groupId && chatId ? `/api/groups/${groupId}/chats/${chatId}` : null;
    const { data, error, isLoading, mutate } = useSWR<ChatDTO>(key, fetcher, {
        onError: () => {},
    });

    const sendMessage = async (message: string) => {
        if (!groupId || !chatId) throw new Error("groupId and chatId are required");
        const res = await fetch(`/api/groups/${groupId}/chats/${chatId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message }),
        });
        if (!res.ok) {
            const info = await res.json().catch(() => ({}));
            throw new Error(info.message || "Failed to send message");
        }
        return (await res.json()) as { _id: string; message: string } & Record<string, unknown>;
    };

    return { chat: data, isLoading, error, mutate, sendMessage };
}
