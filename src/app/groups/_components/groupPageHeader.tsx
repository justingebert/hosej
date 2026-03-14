import type { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CircleHelp, User } from "lucide-react";

export function GroupPageHeader({ router }: { router: ReturnType<typeof useRouter> }) {
    return (
        <div className="flex justify-between items-center w-full shrink-0">
            <Button
                variant="ghost"
                className="rounded-full bg-muted/50 hover:bg-muted"
                size="icon"
                haptic="navigation"
                onClick={() => router.push(`/help`)}
            >
                <CircleHelp className="h-5 w-5" />
            </Button>
            <h1 className="text-4xl font-bold tracking-tight px-4">Groups</h1>
            <Button
                variant="ghost"
                className="rounded-full bg-muted/50 hover:bg-muted"
                size="icon"
                haptic="navigation"
                onClick={() => router.push(`/settings`)}
            >
                <User className="h-5 w-5" />
            </Button>
        </div>
    );
}
