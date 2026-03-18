import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function GroupListSkeleton() {
    return (
        <div className="flex-grow overflow-y-auto py-6 max-w-5xl mx-auto w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-24">
                {[...Array(6)].map((_, i) => (
                    <Card
                        key={i}
                        className="cursor-pointer bg-gradient-to-br from-background to-muted/50 border shadow-sm rounded-2xl overflow-hidden"
                    >
                        <CardContent className="flex justify-between items-center p-5">
                            <div className="flex flex-col gap-2">
                                <Skeleton className="h-6 w-32 rounded-md" />
                                <Skeleton className="h-4 w-24 rounded-md" />
                            </div>
                            <div className="flex space-x-2">
                                <Skeleton className="h-9 w-9 rounded-full" />
                                <Skeleton className="h-9 w-9 rounded-full" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
