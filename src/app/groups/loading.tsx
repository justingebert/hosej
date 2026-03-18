import { Skeleton } from "@/components/ui/skeleton";
import { GroupListSkeleton } from "@/app/groups/_components/groupListSkeleton";

export default function GroupsLoading() {
    return (
        <div className="relative min-h-screen flex flex-col">
            <div className="flex justify-between items-center w-full">
                <Skeleton className="h-10 w-10" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-10" />
            </div>
            <GroupListSkeleton />
        </div>
    );
}
