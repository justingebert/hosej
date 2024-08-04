"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

export const ThemeColorMeta = () => {
  const { theme } = useTheme();

  useEffect(() => {
    const getComputedStyleValue = (variableName: string) => {
      return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
    };

    const themeColor = getComputedStyleValue("--background"); // Use the background variable
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    const metaStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');

    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", themeColor);
    } else {
      const newMeta = document.createElement("meta");
      newMeta.name = "theme-color";
      newMeta.content = themeColor;
      document.head.appendChild(newMeta);
    }

    if (metaStatusBar) {
      const statusBarStyle = theme === "dark" ? "black-translucent" : "white"; // Use default for light, black-translucent for dark
      metaStatusBar.setAttribute("content", statusBarStyle);
    } else {
      const newMetaStatusBar = document.createElement("meta");
      newMetaStatusBar.name = "apple-mobile-web-app-status-bar-style";
      newMetaStatusBar.content = theme === "dark" ? "black-translucent" : "white";
      document.head.appendChild(newMetaStatusBar);
    }
  }, [theme]);

  return null;
};
