"use client";

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
      className="rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/70 transition hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
    >
      {light ? "Dark" : "Light"}
    </button>
  );
}
