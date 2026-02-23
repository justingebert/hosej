import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function GroupsLoading() {
    return (
        <div className="relative min-h-screen flex flex-col">
            <div className="flex justify-between items-center w-full">
                <Skeleton className="h-10 w-10" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-10" />
            </div>
            <div className="flex-grow overflow-y-auto py-6">
                <div className="grid grid-cols-1 gap-6 pb-24">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i}>
                            <CardContent className="flex justify-between items-center p-4">
                                <div>
                                    <Skeleton className="h-6 w-32" />
                                    <Skeleton className="h-4 w-24 mt-1" />
                                </div>
                                <Skeleton className="h-8 w-8" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
