import React from "react";
import Link from "next/link";
import { ArrowLeft } from 'lucide-react';

const BackLink = ({ href = "/", children }: { href?: string, children?: React.ReactNode }) => (
  <div className="flex items-center justify-between mb-4">
    <Link className="text-lg " href={href}>
      <ArrowLeft />
    </Link>
    {children}
  </div>
);

export default BackLink;