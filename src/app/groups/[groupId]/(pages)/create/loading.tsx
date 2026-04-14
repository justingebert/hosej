import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/ui/custom/Header";

export default function CreateLoading() {
    return (
        <>
            <Header title="Create" />

            <div className="mt-4">
                <Skeleton className="h-10 w-full mb-6" />

                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
            </div>

            <div className="flex justify-center fixed bottom-6 left-0 w-full p-6 bg-background mb-16">
                <Skeleton className="h-12 w-full" />
            </div>
        </>
    );
}
