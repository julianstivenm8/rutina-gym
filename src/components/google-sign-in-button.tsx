"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { GoogleIcon, SpinnerIcon } from "./icons";
import { Button } from "./ui/button";

export function GoogleSignInButton({ available }: { available: boolean }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setPending(true);
    setError(null);
    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
        errorCallbackURL: "/iniciar-sesion?error=google",
      });
      if (result.error) throw new Error("Google sign-in failed");
    } catch {
      setError("No pudimos conectar con Google. Inténtalo de nuevo.");
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Button variant="outline" size="lg" className="w-full gap-3" disabled={!available || pending} onClick={signIn} aria-busy={pending} aria-describedby={error ? "google-sign-in-error" : undefined}>
        {pending ? <SpinnerIcon size={20} className="animate-spin motion-reduce:animate-none" /> : <GoogleIcon size={20} />}
        {pending ? "Conectando con Google…" : "Continuar con Google"}
      </Button>
      {error && <p id="google-sign-in-error" role="alert" className="text-[12px] leading-[1.7] text-coral">{error}</p>}
    </div>
  );
}
