"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useToast } from "@/hooks/use-toast";
import { HoseJLoader } from "@/components/ui/custom/HoseJLoader";

export default function JoinGroupPage() {
    const params = useParams<{ groupId: string }>();
    const groupId = params?.groupId;
    const router = useRouter();
    const { user } = useAuthRedirect();
    const { toast } = useToast();

    useEffect(() => {
        if (!user || !groupId) return;

        const joinGroup = async () => {
            try {
                const res = await fetch(`/api/groups/${groupId}/members`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                });

                if (!res.ok) {
                    const data = await res.json();
                    toast({
                        title: "Could not join group",
                        description: data.message,
                        variant: "destructive",
                    });
                    router.replace("/groups");
                    return;
                }

                toast({ title: "Joined group!" });
                router.replace(`/groups/${groupId}/dashboard`);
            } catch {
                toast({ title: "Something went wrong", variant: "destructive" });
                router.replace("/groups");
            }
        };

        joinGroup();
    }, [user, groupId, router, toast]);

    return <HoseJLoader />;
}
