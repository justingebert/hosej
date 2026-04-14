import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

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
                    <React.Fragment key={i}>{children(i)}</React.Fragment>
                ) : (
                    <Skeleton key={i} className={className} />
                )
            )}
        </>
    );
}
