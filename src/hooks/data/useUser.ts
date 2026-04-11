import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import type { UserDTO, UpdateUserData } from "@/types/models/user";

const KEY = "/api/users";

export function useUser(enabled: boolean = true) {
    const { data, error, isLoading, mutate } = useSWR<UserDTO>(enabled ? KEY : null, fetcher);

    const updateUser = async (patch: UpdateUserData) => {
        const res = await fetch(KEY, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch),
        });
        if (!res.ok) {
            const info = await res.json().catch(() => ({}));
            throw new Error(info.message || "Failed to update user");
        }
        await mutate();
    };

    return { user: data, isLoading, error, mutate, updateUser };
}
