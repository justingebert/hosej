"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0'); // Convert to Hex and prefix "0" if needed
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export const ThemeColorMeta = () => {
  const { theme } = useTheme();
  const [backgroundColor, setBackgroundColor] = useState<string>("");

  useEffect(() => {
    const getComputedStyleValue = (variableName: string) => {
      return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
    };

    const parseHSL = (hsl: string): string => {
      const [h, s, l] = hsl.match(/\d+(\.\d+)?/g)?.map(Number) || [0, 0, 0];
      return hslToHex(h, s, l);
    };

    const newBackgroundColor = getComputedStyleValue("--background");
    const hexColor = parseHSL(newBackgroundColor);
    setBackgroundColor(hexColor);
    console.log(hexColor);
  }, [theme]);

  return (
    <>
      <meta name="theme-color" content={backgroundColor} />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="#014473" />
    </>
  );
};
