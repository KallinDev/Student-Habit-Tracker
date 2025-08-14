import React, { useState, useEffect } from "react";
import { ThemeContext } from "./ThemeContext.js";

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const stored = localStorage.getItem("isDarkMode");
    return stored ? JSON.parse(stored) : false;
  });

  useEffect(() => {
    localStorage.setItem("isDarkMode", JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  const themeClasses = {
    mainBg: isDarkMode ? "bg-gray-900" : "bg-gray-50",
    sidebarBg: isDarkMode ? "bg-gray-800" : "bg-white",
    cardBg: isDarkMode ? "bg-gray-800" : "bg-white",
    text: isDarkMode ? "text-white" : "text-gray-900",
    textSecondary: isDarkMode ? "text-gray-300" : "text-gray-600",
    textMuted: isDarkMode ? "text-gray-400" : "text-gray-500",
    border: isDarkMode
      ? "border-gray-700 border-opacity-40"
      : "border-gray-200 border-opacity-70",
    hoverBg: isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50",
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, themeClasses }}>
      {children}
    </ThemeContext.Provider>
  );
};
