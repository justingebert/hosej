"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useToast } from "@/hooks/use-toast";
import { HoseJLoader } from "@/components/ui/custom/HoseJLoader";

// Web join flow (the old /join/[groupId] auto-join, repointed to invite codes).
// Lives OUTSIDE /join/* so it isn't captured by the Universal-Link rule — i.e. an
// app-installed user who taps "Continue on web" lands here instead of bouncing back
// into the app. The proxy redirects unauthenticated users to /login?callbackUrl=…,
// so by the time this renders the user is signed in; then we accept the invite.
export default function WebJoinPage() {
    const params = useParams<{ code: string }>();
    const code = params?.code;
    const router = useRouter();
    const { user } = useAuthRedirect();
    const { toast } = useToast();

    useEffect(() => {
        if (!user || !code) return;

        const join = async () => {
            try {
                const res = await fetch(`/api/invites/${code}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                });

                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    toast({
                        title: "Could not join group",
                        description: data.message,
                        variant: "destructive",
                    });
                    router.replace("/groups");
                    return;
                }

                const { group } = await res.json();
                toast({ title: "Joined group!" });
                router.replace(`/groups/${group._id}/dashboard`);
            } catch {
                toast({ title: "Something went wrong", variant: "destructive" });
                router.replace("/groups");
            }
        };

        join();
    }, [user, code, router, toast]);

    return <HoseJLoader />;
}
