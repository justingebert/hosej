import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/ui/custom/Header";

export default function DailyLoading() {
    return (
        <div className="flex flex-col h-[100dvh]">
            <Header leftComponent={<Skeleton className="h-6 w-6" />} title={null} />

            {/* Tabs skeleton */}
            <Skeleton className="w-full h-10 rounded-md mb-6" />

            {/* Question card skeleton */}
            <Skeleton className="w-full h-20 rounded-2xl mb-6" />

            {/* Content skeletons */}
            <Skeleton className="w-full h-[300px] rounded-2xl mb-6" />
            <Skeleton className="w-full h-[300px] rounded-2xl mb-6" />
        </div>
    );
}
