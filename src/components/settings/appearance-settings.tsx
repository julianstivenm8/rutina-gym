"use client";
import type { CSSProperties } from "react";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import {
  useThemePreference,
  type ThemePreference,
} from "@/lib/theme-preference";
import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";

const themes = [
  { id: "system", label: "Sistema", icon: Monitor },
  { id: "light", label: "Claro", icon: Sun },
  { id: "dark", label: "Oscuro", icon: Moon },
] as const;
function ThemePreview({ mode }: { mode: "light" | "dark" }) {
  // Root theme tokens are inherited as resolved colors; previews need both palettes at once.
  const palette =
    mode === "light"
      ? {
          "--color-paper": "#f6f5ef",
          "--color-surface": "#fdfcf8",
          "--color-line": "#dedfd5",
          "--color-ink": "#283d33",
          "--color-sage": "#58735f",
          "--color-sage-light": "#e9ede4",
          "--color-lavender": "#817294",
          "--color-lavender-light": "#efebf3",
          "--color-coral": "#b45b46",
        }
      : {
          "--color-paper": "#141c18",
          "--color-surface": "#1c2721",
          "--color-line": "#405046",
          "--color-ink": "#e6ede2",
          "--color-sage": "#a8c69c",
          "--color-sage-light": "#2a3a2d",
          "--color-lavender": "#bba7d1",
          "--color-lavender-light": "#332c3f",
          "--color-coral": "#e6a38b",
        };
  return (
    <div
      aria-hidden="true"
      style={{ colorScheme: mode, ...palette } as CSSProperties}
      className="flex aspect-[1.55] w-full flex-col overflow-hidden rounded-lg border border-line bg-paper"
    >
      <div className="flex h-[20%] items-center gap-1 border-b border-line bg-surface px-2">
        <span className="size-1 rounded-full bg-coral" />
        <span className="size-1 rounded-full bg-lavender" />
        <span className="size-1 rounded-full bg-sage" />
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="flex w-[24%] flex-col gap-1.5 border-r border-line p-2">
          <span className="h-1 rounded-full bg-sage/40" />
          <span className="h-1 rounded-full bg-line" />
          <span className="h-1 rounded-full bg-line" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2 p-2.5">
          <span className="h-1.5 w-2/3 rounded-full bg-ink/65" />
          <div className="grid flex-1 grid-cols-2 gap-1.5">
            <span className="rounded bg-sage-light" />
            <span className="rounded bg-lavender-light" />
          </div>
          <span className="h-1 w-4/5 rounded-full bg-line" />
        </div>
      </div>
    </div>
  );
}
export function AppearanceSettings() {
  const { preference, setPreference } = useThemePreference();
  return (
    <section
      id="apariencia"
      aria-labelledby="appearance-title"
      className="scroll-mt-6 border-b border-line pb-9"
    >
      <div className="mb-5">
        <h2 id="appearance-title" className="font-heading text-[32px]">
          Apariencia
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Elige cómo quieres ver tu espacio.
        </p>
      </div>
      <ToggleGroup
        type="single"
        value={preference}
        spacing={1}
        className="grid w-full grid-cols-3 gap-3 mobile:gap-2"
        aria-label="Tema de la aplicación"
        onValueChange={(value) => {
          if (value) setPreference(value as ThemePreference);
        }}
      >
        {themes.map(({ id, label, icon: Icon }) => (
          <ToggleGroupItem
            key={id}
            value={id}
            className={cn(
              "h-auto min-w-0 flex-col items-stretch gap-3 rounded-xl border border-line bg-surface p-3 text-left mobile:p-2",
              preference === id && "border-sage ring-1 ring-sage/20",
            )}
          >
            {id === "system" ? (
              <div className="relative w-full">
                <ThemePreview mode="light" />
                <div className="absolute inset-0 [clip-path:inset(0_0_0_50%)]">
                  <ThemePreview mode="dark" />
                </div>
              </div>
            ) : (
              <ThemePreview mode={id} />
            )}
            <span className="flex items-center justify-between gap-1">
              <span className="flex items-center gap-1.5 text-xs mobile:text-[11px]">
                <Icon size={14} />
                {label}
              </span>
              {preference === id && <Check size={14} className="text-sage" />}
            </span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <p
        role="status"
        className="mt-4 max-w-[70ch] text-[11px] leading-relaxed text-muted"
      >
        Se aplica al instante y también actualiza el botón del encabezado. Al
        recargar, vuelve a seguir el tema de tu dispositivo.
      </p>
    </section>
  );
}
