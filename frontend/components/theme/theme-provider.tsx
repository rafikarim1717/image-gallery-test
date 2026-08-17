"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void } | null>(null);

// D3: dark/light toggle held in shared state, surviving a page refresh.
// The blocking script in layout.tsx sets the class before paint (no flash);
// this provider just keeps React and localStorage in sync after that.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  // Gates the write effect below until the read effect has run at least
  // once. Without this, both effects fire in the same commit on mount and
  // the write effect closes over the stale initial "light" — it would
  // overwrite the class + localStorage the blocking script just set,
  // *before* setTheme("dark") from the read effect has taken effect. In
  // dev, StrictMode's double-invoke turns that one bad write into the
  // settled value, flipping a saved "dark" preference back to light on
  // every refresh.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const current = document.documentElement.classList.contains("dark") ? "dark" : "light";
    setTheme(current);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme, mounted]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
