import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/ui/custom/Header";

export default function JukeboxLoading() {
    return (
        <>
            <Header leftComponent={<Skeleton className="h-6 w-6" />} title={null} />

            <div className="space-y-3">
                {[...Array(8)].map((_, index) => (
                    <div key={index} className="flex items-center gap-4 p-3">
                        <Skeleton className="w-16 h-16 rounded-md shrink-0" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}
