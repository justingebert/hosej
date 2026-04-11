import useSWR, { mutate as globalMutate } from "swr";
import fetcher from "@/lib/fetcher";
import type { GroupWithAdminDTO, UpdateGroupData } from "@/types/models/group";

const groupKey = (groupId: string | null | undefined) =>
    groupId ? `/api/groups/${groupId}` : null;

export function useGroup(groupId: string | null | undefined) {
    const key = groupKey(groupId);
    const { data, error, isLoading, mutate } = useSWR<GroupWithAdminDTO>(key, fetcher);

    const updateGroup = async (patch: UpdateGroupData) => {
        if (!groupId) throw new Error("groupId is required");
        const res = await fetch(`/api/groups/${groupId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch),
        });
        if (!res.ok) {
            const info = await res.json().catch(() => ({}));
            throw new Error(info.message || "Failed to update group");
        }
        await mutate();
    };

    const deleteGroup = async () => {
        if (!groupId) throw new Error("groupId is required");
        const res = await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
        if (!res.ok) {
            const info = await res.json().catch(() => ({}));
            throw new Error(info.message || "Failed to delete group");
        }
        await mutate(undefined, { revalidate: false });
        await globalMutate("/api/groups");
    };

    const kickMember = async (memberId: string) => {
        if (!groupId) throw new Error("groupId is required");
        const res = await fetch(`/api/groups/${groupId}/members/${memberId}`, {
            method: "DELETE",
        });
        if (!res.ok) {
            const info = await res.json().catch(() => ({}));
            throw new Error(info.message || "Failed to kick member");
        }
        await mutate();
    };

    const leaveGroup = async (userId: string) => {
        if (!groupId) throw new Error("groupId is required");
        const res = await fetch(`/api/groups/${groupId}/members/${userId}`, {
            method: "DELETE",
        });
        if (!res.ok) {
            const info = await res.json().catch(() => ({}));
            throw new Error(info.message || "Failed to leave group");
        }
        await globalMutate("/api/groups");
    };

    return {
        group: data,
        isLoading,
        error,
        mutate,
        updateGroup,
        deleteGroup,
        kickMember,
        leaveGroup,
    };
}
