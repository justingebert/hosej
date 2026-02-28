import { Skeleton } from "@/components/ui/skeleton";

interface SkeletonListProps {
    count: number;
    className?: string;
    children?: (index: number) => React.ReactNode;
}

export function SkeletonList({ count, className = "h-12 mb-4", children }: SkeletonListProps) {
    return (
        <>
            {[...Array(count)].map((_, i) =>
                children ? (
                    <div key={i}>{children(i)}</div>
                ) : (
                    <Skeleton key={i} className={className} />
                )
            )}
        </>
    );
}
