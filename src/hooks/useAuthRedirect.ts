import { useEffect } from "react";
import { signIn, useSession } from "next-auth/react";

export function useAuthRedirect() {
    const { data: session, status, update } = useSession();

    useEffect(() => {
        if (status === "loading") return;
        if (!session) signIn();
    }, [status, session]);

    const user = session?.user;

    return { session, status, user, update };
}
