import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/ui/custom/Header";

export default function RallyLoading() {
    return (
        <div>
            <Header leftComponent={<Skeleton className="h-6 w-6" />} title={null} />

            {/* Tab bar skeleton */}
            <Skeleton className="w-full h-10 rounded-md mb-4" />

            {/* Rally info skeleton */}
            <Skeleton className="w-full h-20 rounded-2xl mb-6" />

            {/* Image grid skeleton */}
            <Skeleton className="w-full h-96 rounded-2xl mb-6" />

            {/* Action button skeleton */}
            <Skeleton className="w-full h-12 rounded-md" />
        </div>
    );
}
