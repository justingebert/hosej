"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export const ThemeColorMeta = () => {
  const { theme } = useTheme();
  const [backgroundColor, setBackgroundColor] = useState<string>("");

  useEffect(() => {
    const getComputedStyleValue = (variableName: string) => {
      return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
    };

    const newBackgroundColor = getComputedStyleValue("--background");
    setBackgroundColor(newBackgroundColor);
    console.log(newBackgroundColor);
  }, [theme]);

  return (
    <>
          <meta name="theme-color" content={backgroundColor}/>
          <meta name="apple-mobile-web-app-capable" content="yes"/>
          <meta name="apple-mobile-web-app-status-bar-style" content={backgroundColor}/>
    </>
  );
};
