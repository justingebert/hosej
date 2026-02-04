import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import BackLink from "@/components/ui/custom/BackLink";

const Header = ({
    leftComponent = null,
    href,
    title,
    rightComponent = null,
}: {
    leftComponent?: React.ReactNode;
    href?: string;
    title?: string | null;
    rightComponent?: React.ReactNode;
}) => {
    const resolvedLeft = leftComponent ?? (href ? <BackLink href={href} /> : null);

    let titleNode: React.ReactNode = null;
    if (title === null) {
        titleNode = <Skeleton className="w-40 h-6 mx-auto" />;
    } else if (typeof title === "string") {
        titleNode = title;
    }

    return (
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">{resolvedLeft || <div className="w-6" />}</div>

            <h1 className="text-xl font-bold text-center flex-grow">{titleNode}</h1>

            <div className="flex items-center justify-end">
                {rightComponent || <div className="w-6" />}
            </div>
        </div>
    );
};

export default Header;
