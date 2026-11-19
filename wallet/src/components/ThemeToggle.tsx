"use client";

import { useEffect, useState } from "react";

// Light porcelain or the starry night. The choice is remembered; without one, the system setting decides.
// The inline script in the root layout applies it before the first paint.
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState<boolean | null>(null);
  useEffect(() => setDark(document.documentElement.dataset.theme === "dark"), []);
  function flip() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  }
  if (dark === null) return null;
  return (
    <button type="button" className={`theme-toggle ${className}`} onClick={flip} aria-label={dark ? "Light theme" : "Starry night theme"} title={dark ? "Light theme" : "Starry night theme"}>
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        {dark ? (
          <path d="M12 4V2m0 20v-2m8-8h2M2 12h2m13.7-5.7 1.4-1.4M4.9 19.1l1.4-1.4m0-11.4L4.9 4.9m14.2 14.2-1.4-1.4M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        ) : (
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        )}
      </svg>
    </button>
  );
}

// Runs in <head> before paint: the saved choice, else the system setting.
export const THEME_SCRIPT = `try{var t=localStorage.getItem("theme");if(!t)t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}`;
