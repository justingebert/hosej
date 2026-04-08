import { Skeleton } from "@/components/ui/skeleton";
import { GroupListSkeleton } from "@/app/groups/_components/groupListSkeleton";

export default function GroupsLoading() {
    return (
        <div className="relative min-h-screen flex flex-col">
            <div className="flex justify-between items-center w-full">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-10 rounded-full" />
            </div>
            <GroupListSkeleton />

            <div className="fixed bottom-0 left-0 w-full backdrop-blur-sm p-8 flex space-x-4">
                <Skeleton className="w-1/2 h-10 rounded-md" />
                <Skeleton className="w-1/2 h-10 rounded-md" />
            </div>
        </div>
    );
}
