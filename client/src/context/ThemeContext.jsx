import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Theme preference: 'dark' | 'light' | 'system'
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem("vidytube_theme_mode") || "dark";
  });

  // Resolved active theme: 'dark' | 'light'
  const [resolvedTheme, setResolvedTheme] = useState("dark");

  useEffect(() => {
    const updateTheme = () => {
      let active = themeMode;
      if (themeMode === "system") {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        active = prefersDark ? "dark" : "light";
      }

      setResolvedTheme(active);
      document.documentElement.setAttribute("data-theme", active);
      localStorage.setItem("vidytube_theme_mode", themeMode);
    };

    updateTheme();

    if (themeMode === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e) => {
        const active = e.matches ? "dark" : "light";
        setResolvedTheme(active);
        document.documentElement.setAttribute("data-theme", active);
      };

      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, [themeMode]);

  const setTheme = (mode) => {
    if (mode === "dark" || mode === "light" || mode === "system") {
      setThemeMode(mode);
    }
  };

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ themeMode, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
