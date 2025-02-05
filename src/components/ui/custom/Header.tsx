import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const Header = ({
  leftComponent = null, 
  title,
  rightComponent = null,
}: {
  leftComponent?: React.ReactNode; 
  href?: string;
  title?: string | null; 
  rightComponent?: React.ReactNode;
}) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center">
      {leftComponent ? leftComponent : <div className="w-6"></div>}
    </div>
    
    <h1 className="text-xl font-bold text-center flex-grow">
      {title ? title : <Skeleton className="w-40 h-6 mx-auto" />}
    </h1>

    <div className="flex items-center justify-end">
      {rightComponent || <div className="w-6"></div>}
    </div>
  </div>
);

export default Header;
