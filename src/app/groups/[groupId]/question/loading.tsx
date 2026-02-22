import { Skeleton } from "@/components/ui/skeleton";

export default function DailyLoading() {
    return (
        <div className="flex flex-col h-[100dvh]">
            {/* Header skeleton */}
            <div className="flex items-center gap-4 p-4">
                <Skeleton className="h-10 w-10 rounded-md" />
                <Skeleton className="h-8 w-48" />
            </div>

            {/* Tabs skeleton */}
            <div className="px-4">
                <Skeleton className="w-full h-10 mb-6" />
                <Skeleton className="w-full h-20 mb-6" />
                <Skeleton className="w-full h-[300px] mb-6" />
                <Skeleton className="w-full h-[300px] mb-6" />
            </div>
        </div>
    );
}
