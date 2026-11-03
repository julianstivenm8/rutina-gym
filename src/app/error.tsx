"use client";

import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="mx-auto max-w-[1440px] px-16 compact:px-9 mobile:px-5">
      <AppHeader />
      <main className="mx-auto flex min-h-[65svh] max-w-[440px] flex-col items-start justify-center gap-5 py-12">
        <h1 className="font-heading text-[40px] leading-[1.1] font-semibold">No pudimos cargar tu sesión</h1>
        <p className="text-[14px] leading-[1.7] text-muted">Intenta de nuevo en un momento.</p>
        <Button onClick={retry}>Volver a intentar</Button>
      </main>
    </div>
  );
}
