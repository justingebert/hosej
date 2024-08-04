import React from "react";
import BackLink from "./BackLink";

const Header = ({
  href = "/",
  title = "",
  rightComponent = null,
}: {
  href?: string;
  title?: string;
  rightComponent?: React.ReactNode;
}) => (
  <div className="flex items-center justify-between mb-5">
    <BackLink href={href} />
    <h1 className="text-xl font-bold text-center flex-grow">{title}</h1>
    <div className="flex items-center justify-end">
      {rightComponent || <div className="w-6"></div>}
    </div>
  </div>
);

export default Header;
