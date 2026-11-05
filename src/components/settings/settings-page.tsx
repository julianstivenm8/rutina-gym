"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Check,
  KeyRound,
  Laptop,
  Loader2,
  LogOut,
  Mail,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import type { AccountSettings } from "@/lib/account-settings";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Alert, AlertDescription } from "../ui/alert";
import { AppearanceSettings } from "./appearance-settings";
import { DeleteAccount } from "./delete-account";

function accountDate(value: string, withTime = false) {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? ({ hour: "2-digit", minute: "2-digit" } as const) : {}),
  }).format(new Date(value));
}
export function SettingsPage({
  initial,
  googleError = false,
}: {
  initial: AccountSettings;
  googleError?: boolean;
}) {
  const [settings, setSettings] = useState(initial),
    [pending, setPending] = useState<"others" | "signout" | null>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const router = useRouter();
  const others = settings.sessions.filter((entry) => !entry.current).length;
  const initials =
    settings.profile.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "MI";
  async function signOut() {
    setPending("signout");
    setError("");
    setNotice("");
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error();
      window.location.replace("/iniciar-sesion");
    } catch {
      setError("No pudimos cerrar tu sesión. Vuelve a intentarlo.");
      setPending(null);
    }
  }
  async function closeOthers() {
    setPending("others");
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/settings/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke-others" }),
        signal: AbortSignal.timeout(15_000),
      });
      if (response.status === 401) {
        router.replace("/iniciar-sesion");
        router.refresh();
        return;
      }
      if (!response.ok) throw new Error();
      const body = (await response.json()) as { settings: AccountSettings };
      setSettings(body.settings);
      setNotice(
        "Las otras sesiones se cerraron. Este dispositivo sigue conectado.",
      );
    } catch {
      setError(
        "No pudimos confirmar el cierre de las otras sesiones. Vuelve a intentarlo.",
      );
    } finally {
      setPending(null);
    }
  }
  return (
    <div className="mx-auto max-w-[1180px]">
      <header className="flex flex-wrap items-end justify-between gap-5 pt-9 pb-8 mobile:pt-7">
        <div>
          <h1 className="font-heading text-[64px] leading-none tracking-[-1px] mobile:text-[49px]">
            Configuración
          </h1>
          <p className="mt-3 text-sm text-muted">Tu espacio, a tu manera.</p>
        </div>
        <p className="flex items-center gap-2 text-[11px] text-muted">
          <ShieldCheck size={16} className="text-sage" />
          Tu cuenta está protegida
        </p>
      </header>
      <div className="mb-9 flex min-w-0 items-center gap-4 rounded-2xl border border-line bg-surface px-6 py-5 mobile:px-4">
        <span className="grid size-14 shrink-0 place-items-center rounded-full bg-lavender-light font-heading text-2xl text-lavender-ink">
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="break-words text-base font-medium">
            {settings.profile.name}
          </p>
          <p className="mt-1 break-all text-xs text-muted">
            {settings.profile.email}
          </p>
        </div>
        {settings.profile.providers.includes("google") && (
          <Badge variant="outline" className="shrink-0 mobile:hidden">
            <Check data-icon="inline-start" />
            Acceso con Google
          </Badge>
        )}
      </div>
      {googleError && (
        <Alert variant="destructive" className="mb-7">
          <AlertDescription>
            No pudimos confirmar el acceso con Google. Puedes volver a
            intentarlo desde la acción que estabas realizando.
          </AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-[190px_minmax(0,1fr)] gap-12 touch:grid-cols-1 touch:gap-7">
        <aside className="touch:hidden">
          <nav
            aria-label="Secciones de configuración"
            className="sticky top-7 flex flex-col gap-1 border-l border-line py-1 pl-4"
          >
            <a
              href="#apariencia"
              className="rounded-md py-2 text-xs no-underline hover:text-sage"
            >
              Apariencia
            </a>
            <a
              href="#acceso"
              className="rounded-md py-2 text-xs no-underline hover:text-sage"
            >
              Acceso y sesiones
            </a>
            <a
              href="#datos-cuenta"
              className="rounded-md py-2 text-xs no-underline hover:text-sage"
            >
              Datos de la cuenta
            </a>
            <a
              href="#eliminar-cuenta"
              className="rounded-md py-2 text-xs text-coral no-underline"
            >
              Eliminar cuenta
            </a>
          </nav>
        </aside>
        <div className="flex min-w-0 flex-col gap-8">
          <AppearanceSettings />
          <section
            id="acceso"
            aria-labelledby="access-title"
            className="scroll-mt-6 border-b border-line pb-8"
          >
            <div className="mb-5">
              <h2 id="access-title" className="font-heading text-[32px]">
                Acceso y sesiones
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                Controla dónde está abierta tu cuenta.
              </p>
            </div>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-surface p-5">
              <div className="flex items-start gap-3">
                <KeyRound size={19} className="mt-0.5 shrink-0 text-lavender" />
                <div>
                  <h3 className="m-0 text-sm font-medium">
                    Contraseña y acceso
                  </h3>
                  <p className="mt-1 max-w-[43ch] text-xs leading-relaxed text-muted">
                    Entras con Google. Tu contraseña se administra en tu cuenta
                    de Google.
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a
                  href="https://myaccount.google.com/security"
                  target="_blank"
                  rel="noreferrer"
                >
                  Gestionar en Google
                  <ArrowUpRight data-icon="inline-end" />
                </a>
              </Button>
              <p className="w-full border-t border-line pt-3 text-[11px] leading-relaxed text-muted">
                El cambio de contraseña dentro de Mi rutina estará disponible
                cuando se habilite el acceso con contraseña.
              </p>
            </div>
            <ul
              aria-label="Sesiones activas de tu cuenta"
              className="m-0 list-none divide-y divide-line p-0"
            >
              {settings.sessions.map((entry) => {
                const Device = /Android|iOS/.test(entry.device)
                  ? Smartphone
                  : Laptop;
                return (
                  <li key={entry.id} className="flex items-start gap-3 py-4">
                    <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-full bg-sage-light text-sage">
                      <Device size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[13px] font-medium">
                          {entry.device}
                        </p>
                        {entry.current && (
                          <Badge variant="secondary" className="text-[10px]">
                            Este dispositivo
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-muted">
                        Sesión iniciada: {accountDate(entry.createdAt, true)}
                      </p>
                      <p className="mt-1 text-[10px] text-muted">
                        Vence el {accountDate(entry.expiresAt)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
              <p className="max-w-[33ch] text-[11px] leading-relaxed text-muted">
                {others
                  ? `${others} ${others === 1 ? "otra sesión abierta" : "otras sesiones abiertas"}. Puedes cerrarlas y seguir aquí.`
                  : "Solo está abierta la sesión de este dispositivo."}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void closeOthers()}
                disabled={pending !== null || !others}
              >
                {pending === "others" && (
                  <Loader2
                    data-icon="inline-start"
                    className="motion-safe:animate-spin"
                  />
                )}
                Cerrar otras sesiones
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-sage-light/50 p-4">
              <div>
                <p className="text-sm font-medium">Cerrar sesión aquí</p>
                <p className="mt-1 text-[11px] text-muted">
                  Tus datos seguirán guardados en tu cuenta.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void signOut()}
                disabled={pending !== null}
                aria-label="Cerrar sesión en este dispositivo"
              >
                {pending === "signout" ? (
                  <Loader2
                    data-icon="inline-start"
                    className="motion-safe:animate-spin"
                  />
                ) : (
                  <LogOut data-icon="inline-start" />
                )}
                Cerrar sesión
              </Button>
            </div>
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <p role="status" className="mt-3 text-xs leading-relaxed text-sage">
              {notice}
            </p>
          </section>
          <section
            id="datos-cuenta"
            aria-labelledby="account-data-title"
            className="scroll-mt-6 border-b border-line pb-8"
          >
            <h2
              id="account-data-title"
              className="mb-5 font-heading text-[32px]"
            >
              Datos de la cuenta
            </h2>
            <dl className="m-0 grid grid-cols-[130px_minmax(0,1fr)] gap-x-6 gap-y-5 text-xs mobile:grid-cols-[85px_minmax(0,1fr)] mobile:gap-x-3">
              <dt className="text-muted">Nombre</dt>
              <dd className="m-0 break-words font-medium">
                {settings.profile.name}
              </dd>
              <dt className="flex items-start gap-2 text-muted">
                <Mail size={14} />
                Correo
              </dt>
              <dd className="m-0 break-all">{settings.profile.email}</dd>
              <dt className="text-muted">Miembro desde</dt>
              <dd className="m-0">{accountDate(settings.profile.createdAt)}</dd>
            </dl>
            <p className="mt-5 text-[11px] leading-relaxed text-muted">
              Tu cuenta reúne {settings.counts.routines}{" "}
              {settings.counts.routines === 1 ? "rutina" : "rutinas"},{" "}
              {settings.counts.weights}{" "}
              {settings.counts.weights === 1
                ? "registro de peso"
                : "registros de peso"}{" "}
              y {settings.counts.bodyRecords}{" "}
              {settings.counts.bodyRecords === 1
                ? "registro corporal"
                : "registros corporales"}
              .
            </p>
          </section>
          <DeleteAccount settings={settings} />
        </div>
      </div>
    </div>
  );
}
