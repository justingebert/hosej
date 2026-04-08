import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/ui/custom/Header";

export default function StatsLoading() {
    return (
        <>
            <Header title="Statistics" />

            {/* Overview stat cards */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-2xl" />
                ))}
            </div>

            {/* Leaderboard section */}
            <Skeleton className="h-10 w-40 mb-2" />
            {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 mb-1 rounded-md" />
            ))}

            {/* Chart sections */}
            <Skeleton className="h-64 mt-6 rounded-2xl" />
            <Skeleton className="h-64 mt-4 rounded-2xl" />
        </>
    );
}
