"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

export const ThemeColorMeta = () => {
  const { theme } = useTheme();

  useEffect(() => {
    const lightThemeColor = "#FFFFFF"; // Replace with your light mode theme color
    const darkThemeColor = "#000000"; // Replace with your dark mode theme color

    const themeColor = theme === "dark" ? darkThemeColor : lightThemeColor;
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');

    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", themeColor);
    } else {
      const newMeta = document.createElement("meta");
      newMeta.name = "theme-color";
      newMeta.content = themeColor;
      document.head.appendChild(newMeta);
    }
  }, [theme]);

  return null;
};
