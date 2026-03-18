import Header from "@/components/ui/custom/Header";
import ThemeSelector from "@/components/ui/custom/ThemeSelector";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonList } from "@/components/ui/custom/SkeletonList";

export function SettingsSkeleton() {
    return (
        <div className="flex flex-col h-[100dvh]">
            <Header href={`/groups/`} title="Settings" rightComponent={<ThemeSelector />} />
            <div className="flex-grow mt-4 space-y-4">
                <div className="flex items-center justify-between mb-4">
                    <span>Notifications</span>
                    <Skeleton className="h-6 w-10" />
                </div>
                <SkeletonList count={4} className="h-10" />
            </div>
            <div className="mt-auto mb-14">
                <Skeleton className="h-12 w-full" />
            </div>
        </div>
    );
}
