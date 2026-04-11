import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/ui/custom/Header";

export default function RallyLoading() {
    return (
        <div>
            <Header leftComponent={<Skeleton className="h-6 w-6" />} title="Rallies" />
        </div>
    );
}
