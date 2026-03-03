"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAppHaptics } from "@/hooks/useAppHaptics";

const BackLink = ({ href = "/" }: { href?: string }) => {
    const { play } = useAppHaptics();

    return (
        <Link className="flex items-center text-lg" href={href} onClick={() => play("navigation")}>
            <ArrowLeft />
        </Link>
    );
};

export default BackLink;
