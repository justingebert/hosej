import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/ui/custom/Header";

export default function SettingsLoading() {
    return (
        <>
            <Header title={null} />

            <div className="space-y-6 pb-12">
                {/* Group info card */}
                <Skeleton className="h-32 rounded-2xl" />

                {/* Feature settings card */}
                <Skeleton className="h-48 rounded-2xl" />

                {/* Members card */}
                <Skeleton className="h-40 rounded-2xl" />

                {/* Danger zone card */}
                <Skeleton className="h-24 rounded-2xl" />
            </div>
        </>
    );
}
