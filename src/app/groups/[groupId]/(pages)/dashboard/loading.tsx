import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
    return (
        <>
            <div className="flex justify-between items-center">
                <Skeleton className="h-10 w-10 rounded-md" />
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-10 w-10 rounded-md" />
            </div>

            <div className="flex flex-col h-[80vh] justify-center">
                <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full">
                    <Skeleton className="h-32 w-full rounded-lg" />
                    <Skeleton className="h-32 w-full rounded-lg" />
                    <Skeleton className="h-32 w-full rounded-lg" />
                </div>
            </div>
        </>
    );
}
