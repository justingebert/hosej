"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useToast } from "@/hooks/use-toast";
import { useGroups } from "@/hooks/data/useGroups";
import { HoseJLoader } from "@/components/ui/custom/HoseJLoader";

export default function JoinGroupPage() {
    const params = useParams<{ groupId: string }>();
    const groupId = params?.groupId;
    const router = useRouter();
    const { user } = useAuthRedirect();
    const { toast } = useToast();
    const { joinGroup } = useGroups(false);

    useEffect(() => {
        if (!user || !groupId) return;

        const run = async () => {
            try {
                await joinGroup(groupId);
                toast({ title: "Joined group!" });
                router.replace(`/groups/${groupId}/dashboard`);
            } catch (err) {
                const message = err instanceof Error ? err.message : "Something went wrong";
                toast({
                    title: "Could not join group",
                    description: message,
                    variant: "destructive",
                });
                router.replace("/groups");
            }
        };

        void run();
    }, [user, groupId, router, toast, joinGroup]);

    return <HoseJLoader />;
}
