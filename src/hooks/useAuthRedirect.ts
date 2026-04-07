import { useEffect } from "react";
import { signIn, useSession } from "next-auth/react";

export function useAuthRedirect() {
    const { data: session, status, update } = useSession();

    useEffect(() => {
        if (status === "loading") return;
        // Don't bounce to sign-in when offline or on a flaky connection —
        // the session fetch may have failed, not the auth itself.
        if (!session && navigator.onLine) signIn();
    }, [status, session]);

    const user = session?.user;

    return { session, status, user, update };
}
