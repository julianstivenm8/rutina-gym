"use client";
import { useSyncExternalStore } from "react";

export type ThemePreference = "system" | "light" | "dark";
const SYSTEM_THEME_QUERY = "(prefers-color-scheme: dark)";
const THEME_CHANGE_EVENT = "routine-theme-change";
function subscribeToSelectedTheme(onChange: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, onChange);
}
function getSelectedTheme(): ThemePreference {
  const theme = document.documentElement.dataset.theme;
  return theme === "light" || theme === "dark" ? theme : "system";
}
function subscribeToSystemTheme(onChange: () => void) {
  const query = window.matchMedia(SYSTEM_THEME_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
function getSystemTheme() {
  return window.matchMedia(SYSTEM_THEME_QUERY).matches;
}
export function setThemePreference(theme: ThemePreference) {
  if (theme === "system") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}
export function useThemePreference() {
  const preference = useSyncExternalStore(
    subscribeToSelectedTheme,
    getSelectedTheme,
    () => "system" as const,
  );
  const systemIsDark = useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemTheme,
    () => false,
  );
  return {
    preference,
    isDark: preference === "system" ? systemIsDark : preference === "dark",
    setPreference: setThemePreference,
  };
}
