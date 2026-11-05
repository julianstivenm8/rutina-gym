"use client";

import { useEffect } from "react";
import { MoonIcon, SunIcon } from "./icons";
import { useThemePreference } from "@/lib/theme-preference";

export function ThemeToggle() {
  const { isDark, setPreference } = useThemePreference();
  const actionLabel = isDark ? "Activar modo claro" : "Activar modo oscuro";

  useEffect(() => {
    const background = window.getComputedStyle(document.body).backgroundColor;
    document
      .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
      .forEach((meta) => {
        meta.content = background;
      });
  }, [isDark]);

  function toggleTheme() {
    setPreference(isDark ? "light" : "dark");
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Modo oscuro"
      aria-pressed={isDark}
      title={actionLabel}
      className="inline-grid size-11 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink transition-colors hover:bg-sage-light motion-reduce:transition-none"
    >
      {isDark ? <SunIcon size={20} /> : <MoonIcon size={20} />}
    </button>
  );
}
