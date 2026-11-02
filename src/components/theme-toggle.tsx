"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { MoonIcon, SunIcon } from "./icons";

const SYSTEM_THEME_QUERY = "(prefers-color-scheme: dark)";

function subscribeToSystemTheme(onChange: () => void) {
  const query = window.matchMedia(SYSTEM_THEME_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getSystemTheme() {
  return window.matchMedia(SYSTEM_THEME_QUERY).matches;
}

function getServerTheme() {
  return false;
}

export function ThemeToggle() {
  const systemIsDark = useSyncExternalStore(subscribeToSystemTheme, getSystemTheme, getServerTheme);
  const [selectedTheme, setSelectedTheme] = useState<"light" | "dark" | null>(null);
  const isDark = selectedTheme ? selectedTheme === "dark" : systemIsDark;
  const actionLabel = isDark ? "Activar modo claro" : "Activar modo oscuro";

  useEffect(() => {
    const background = window.getComputedStyle(document.body).backgroundColor;
    document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
      meta.content = background;
    });
  }, [isDark]);

  function toggleTheme() {
    const nextTheme = isDark ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    setSelectedTheme(nextTheme);
  }

  return (
    <button type="button" onClick={toggleTheme} aria-label="Modo oscuro" aria-pressed={isDark} title={actionLabel}
      className="inline-grid size-11 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink transition-colors hover:bg-sage-light motion-reduce:transition-none">
      {isDark ? <SunIcon size={20} /> : <MoonIcon size={20} />}
    </button>
  );
}
