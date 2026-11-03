"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import type { AuthenticatedUser } from "@/lib/auth-types";
import { LogOutIcon, SpinnerIcon } from "./icons";
import { Button } from "./ui/button";

export function UserMenu({ user }: { user: AuthenticatedUser }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  async function signOut() {
    setPending(true);
    setError(false);
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error("Sign-out failed");
      router.replace("/iniciar-sesion");
      router.refresh();
    } catch {
      setError(true);
      setPending(false);
    }
  }

  return (
    <div className="relative flex items-center gap-3">
      <div className="max-w-[25ch] text-right mobile:hidden">
        <p className="truncate text-[12px] font-medium">{user.name || "Mi cuenta"}</p>
        <p className="mt-1 truncate text-[10px] text-muted">{user.email}</p>
      </div>
      <Button variant="outline" onClick={signOut} disabled={pending} aria-busy={pending} aria-label="Cerrar sesión" className="mobile:size-11 mobile:p-0">
        {pending ? <SpinnerIcon size={18} className="animate-spin motion-reduce:animate-none" /> : <LogOutIcon size={18} />}
        <span className="mobile:sr-only">Salir</span>
      </Button>
      {error && <p role="alert" className="absolute top-full right-0 z-10 mt-3 w-[240px] rounded-lg border border-line bg-surface p-3 text-[12px] leading-[1.6] text-coral">No pudimos cerrar tu sesión. Inténtalo de nuevo.</p>}
    </div>
  );
}
