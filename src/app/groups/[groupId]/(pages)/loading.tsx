import { Skeleton } from "@/components/ui/skeleton";

export default function GroupPagesLoading() {
    return (
        <>
            <Skeleton className="h-6 w-40 mx-auto mb-4" />
            <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
        </>
    );
}
