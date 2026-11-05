"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import {
  deleteAccountSchema,
  type AccountSettings,
} from "@/lib/account-settings";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Field, FieldError, FieldGroup, FieldLabel } from "../ui/field";
import { Alert, AlertDescription } from "../ui/alert";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogCancel,
} from "../ui/alert-dialog";

export function DeleteAccount({ settings }: { settings: AccountSettings }) {
  const [open, setOpen] = useState(false),
    [pending, setPending] = useState(false),
    [reauth, setReauth] = useState(false),
    [error, setError] = useState("");
  const form = useForm<{ confirmation: string; email: string }>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: { confirmation: "", email: "" },
  });
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = form;
  const confirmation = watch("confirmation"),
    email = watch("email");
  async function remove(values: { confirmation: string; email: string }) {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/settings/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        signal: AbortSignal.timeout(20_000),
      });
      const body = (await response.json()) as {
        success?: boolean;
        error?: string;
        code?: string;
      };
      if (!response.ok) {
        setReauth(body.code === "REAUTH_REQUIRED");
        throw new Error(
          body.error ?? "No pudimos eliminar tu cuenta. Vuelve a intentarlo.",
        );
      }
      // A full navigation clears the authenticated router cache after account deletion.
      window.location.replace("/iniciar-sesion");
    } catch (reason) {
      setError(
        reason instanceof Error && reason.name === "Error"
          ? reason.message
          : "No pudimos confirmar la eliminación. Comprueba tu conexión y vuelve a intentarlo.",
      );
      setPending(false);
    }
  }
  async function verifyGoogle() {
    setPending(true);
    setError("");
    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/configuracion",
        errorCallbackURL: "/configuracion?error=google",
      });
      if (result.error) throw new Error();
    } catch {
      setError("No pudimos conectar con Google. Vuelve a intentarlo.");
      setPending(false);
    }
  }
  return (
    <section
      id="eliminar-cuenta"
      aria-labelledby="delete-account-title"
      className="scroll-mt-6 rounded-2xl border border-coral/25 bg-coral-light/35 p-6 mobile:p-5"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle size={20} className="mt-1 shrink-0 text-coral" />
        <div>
          <h2 id="delete-account-title" className="font-heading text-[30px]">
            Eliminar cuenta
          </h2>
          <p className="mt-2 max-w-[62ch] text-xs leading-relaxed text-muted">
            Elimina de forma permanente tu cuenta de Mi rutina y sus rutinas,
            pesos y medidas corporales. Tu cuenta de Google se conserva.
          </p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] text-muted">
          Esta acción no se puede deshacer.
        </p>
        <AlertDialog
          open={open}
          onOpenChange={(value) => {
            if (pending) return;
            setOpen(value);
            if (!value) {
              reset();
              setError("");
              setReauth(false);
            }
          }}
        >
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 data-icon="inline-start" />
              Eliminar mi cuenta
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent
            className="max-h-[90dvh] overflow-y-auto rounded-2xl"
            onEscapeKeyDown={(event) => {
              if (pending) event.preventDefault();
            }}
          >
            <form
              noValidate
              onSubmit={handleSubmit(remove)}
              className="flex min-w-0 flex-col gap-5"
            >
              <AlertDialogHeader>
                <AlertDialogTitle>
                  ¿Eliminar tu cuenta de Mi rutina?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Se borrarán tus datos y se cerrarán todas tus sesiones. No
                  podrás recuperar tus registros.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="grid grid-cols-3 gap-2 rounded-xl bg-paper p-4 text-center">
                <p className="text-[11px] text-muted">
                  <strong className="mb-1 block font-heading text-2xl text-ink">
                    {settings.counts.routines}
                  </strong>
                  Rutinas
                </p>
                <p className="text-[11px] text-muted">
                  <strong className="mb-1 block font-heading text-2xl text-ink">
                    {settings.counts.weights}
                  </strong>
                  Pesos
                </p>
                <p className="text-[11px] text-muted">
                  <strong className="mb-1 block font-heading text-2xl text-ink">
                    {settings.counts.bodyRecords}
                  </strong>
                  Registros corporales
                </p>
              </div>
              <FieldGroup className="gap-4">
                <Field data-invalid={!!errors.email}>
                  <FieldLabel
                    htmlFor="delete-account-email"
                    className="text-xs"
                  >
                    Escribe el correo de esta cuenta
                  </FieldLabel>
                  <p className="break-all text-xs text-muted">
                    {settings.profile.email}
                  </p>
                  <Input
                    id="delete-account-email"
                    type="email"
                    autoComplete="off"
                    spellCheck={false}
                    {...register("email")}
                    disabled={pending}
                    aria-invalid={!!errors.email}
                  />
                  <FieldError>{errors.email?.message}</FieldError>
                </Field>
                <Field data-invalid={!!errors.confirmation}>
                  <FieldLabel
                    htmlFor="delete-account-confirmation"
                    className="text-xs"
                  >
                    Escribe ELIMINAR para confirmar
                  </FieldLabel>
                  <Input
                    id="delete-account-confirmation"
                    autoComplete="off"
                    spellCheck={false}
                    {...register("confirmation")}
                    disabled={pending}
                    aria-invalid={!!errors.confirmation}
                  />
                  <FieldError>{errors.confirmation?.message}</FieldError>
                </Field>
              </FieldGroup>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {reauth && (
                <Button
                  variant="outline"
                  disabled={pending}
                  onClick={() => void verifyGoogle()}
                >
                  {pending && (
                    <Loader2
                      data-icon="inline-start"
                      className="motion-safe:animate-spin"
                    />
                  )}
                  Confirmar acceso con Google
                </Button>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel disabled={pending}>
                  Conservar mi cuenta
                </AlertDialogCancel>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={
                    pending ||
                    reauth ||
                    confirmation.trim() !== "ELIMINAR" ||
                    email.toLowerCase() !== settings.profile.email.toLowerCase()
                  }
                >
                  {pending ? (
                    <Loader2
                      data-icon="inline-start"
                      className="motion-safe:animate-spin"
                    />
                  ) : (
                    <Trash2 data-icon="inline-start" />
                  )}
                  Eliminar definitivamente
                </Button>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </section>
  );
}
