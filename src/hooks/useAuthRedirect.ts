import { useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { IUserJson } from "@/types/models/user";

export function useAuthRedirect() {
    const { data: session, status, update } = useSession();

    useEffect(() => {
        if (status === "loading") return;
        if (!session) signIn();
    }, [status, session]);

    const user = session?.user as IUserJson;

    return { session, status, user, update };
}
