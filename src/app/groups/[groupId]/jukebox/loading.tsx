import { Skeleton } from "@/components/ui/skeleton";

export default function JukeboxLoading() {
    return (
        <div className="space-y-3 mt-12">
            {[...Array(8)].map((_, index) => (
                <Skeleton key={index} className="p-3 rounded-md flex items-center gap-4">
                    <Skeleton className="w-16 h-16 rounded-md bg-primary-foreground" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4 bg-primary-foreground" />
                        <Skeleton className="h-4 w-1/2 bg-primary-foreground" />
                    </div>
                </Skeleton>
            ))}
        </div>
    );
}
