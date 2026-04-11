import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/ui/custom/Header";

export default function DailyLoading() {
    return (
        <div className="flex flex-col h-[100dvh]">
            <Header leftComponent={<Skeleton className="h-6 w-6" />} title="Daily Questions" />
        </div>
    );
}
