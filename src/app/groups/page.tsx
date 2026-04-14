"use client";
import { useRouter } from "next/navigation";
import { JoinGroupDrawer } from "@/app/groups/_components/joinGroupDrawer";
import { CreateGroupDrawer } from "@/app/groups/_components/createGroupDrawer";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { GroupsList } from "@/app/groups/_components/groupsList";
import { GroupPageHeader } from "@/app/groups/_components/groupPageHeader";
import { OnboardingDrawer } from "@/components/onboarding/OnboardingDrawer";

export default function GroupsPage() {
    const router = useRouter();
    const { user } = useAuthRedirect();

    return (
        <div className="relative min-h-screen flex flex-col">
            {user && user.onboardingCompleted === false && <OnboardingDrawer />}
            <GroupPageHeader router={router} />

            <GroupsList user={user} />

            <div className="fixed bottom-0 left-0 w-full backdrop-blur-sm p-8 flex space-x-4">
                <div className="w-1/2">
                    <CreateGroupDrawer />
                </div>
                <div className="w-1/2">
                    <JoinGroupDrawer />
                </div>
            </div>
        </div>
    );
}
