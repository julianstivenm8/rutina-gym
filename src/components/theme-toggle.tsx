"use client";

import { useEffect, useSyncExternalStore } from "react";
import { MoonIcon, SunIcon } from "./icons";

const SYSTEM_THEME_QUERY = "(prefers-color-scheme: dark)";
const THEME_CHANGE_EVENT = "routine-theme-change";

function subscribeToSelectedTheme(onChange: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, onChange);
}

function getSelectedTheme(): "light" | "dark" | null {
  const theme = document.documentElement.dataset.theme;
  return theme === "light" || theme === "dark" ? theme : null;
}

function getServerSelectedTheme() {
  return null;
}

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
  const selectedTheme = useSyncExternalStore(subscribeToSelectedTheme, getSelectedTheme, getServerSelectedTheme);
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
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }

  return (
    <button type="button" onClick={toggleTheme} aria-label="Modo oscuro" aria-pressed={isDark} title={actionLabel}
      className="inline-grid size-11 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink transition-colors hover:bg-sage-light motion-reduce:transition-none">
      {isDark ? <SunIcon size={20} /> : <MoonIcon size={20} />}
    </button>
  );
}
