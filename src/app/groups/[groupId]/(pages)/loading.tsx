import { Skeleton } from "@/components/ui/skeleton";

export default function GroupPagesLoading() {
    return (
        <>
            <div className="flex justify-between items-center mb-8">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-10 w-10 rounded-full" />
            </div>

            <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full">
                {[...Array(3)].map((_, i) => (
                    <Skeleton
                        key={i}
                        className="h-[140px] rounded-2xl w-full flex items-center justify-between px-6 py-5"
                    >
                        <div className="flex flex-col gap-2">
                            <Skeleton className="h-3 w-20 bg-primary-foreground/10" />
                            <Skeleton className="h-7 w-40 bg-primary-foreground/10" />
                            <Skeleton className="h-4 w-32 bg-primary-foreground/10" />
                        </div>
                        <Skeleton className="h-20 w-20 rounded-full bg-primary-foreground/10 shrink-0" />
                    </Skeleton>
                ))}
            </div>
        </>
    );
}
