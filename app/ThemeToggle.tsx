"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    void Promise.resolve().then(() => {
      const saved = window.localStorage.getItem("hirex-theme");
      const isLight = saved === "light";
      setLight(isLight);
      document.documentElement.classList.toggle("light-mode", isLight);
    });
  }, []);

  function toggleTheme() {
    const nextLight = !light;
    setLight(nextLight);
    window.localStorage.setItem("hirex-theme", nextLight ? "light" : "dark");
    document.documentElement.classList.toggle("light-mode", nextLight);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={light ? "Use dark mode" : "Use light mode"}
      title={light ? "Use dark mode" : "Use light mode"}
      className="fixed bottom-5 right-5 z-[60] flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/70 shadow-lg backdrop-blur transition hover:text-white"
    >
      {light ? <Moon size={17} /> : <Sun size={17} />}
    </button>
  );
}
