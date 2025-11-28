import React from "react";
import Link from "next/link";
import { ArrowLeft } from 'lucide-react';

const BackLink = ({href = "/"}: { href?: string }) => (
    <Link className="flex items-center text-lg" href={href}>
        <ArrowLeft/>
    </Link>
);

export default BackLink;
