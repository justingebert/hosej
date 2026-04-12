import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/ui/custom/Header";
import { SkeletonList } from "@/components/ui/custom/SkeletonList";

export default function HistoryLoading() {
    return (
        <>
            <Header title="Question History" />

            <SkeletonList count={3} className="h-10 w-full mb-2" />

            <div className="flex flex-col items-center space-y-4 mt-4">
                <SkeletonList count={12} className="h-10 w-11/12" />
            </div>
        </>
    );
}
