import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { ActivityIcon, DumbbellIcon } from "@/components/icons";
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card";
import { readAuthEnvironment } from "@/lib/auth-environment";
import { getCurrentSession } from "@/lib/auth-session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Entrar · Mi rutina" };

export default async function SignInPage({ searchParams }: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const session = await getCurrentSession();
  if (session) redirect("/");

  const { error } = await searchParams;
  const available = readAuthEnvironment().ready;

  return (
    <div className="mx-auto max-w-[1440px] px-16 wide:px-[70px] compact:px-9 tablet:px-[26px] mobile:px-5 small:px-3.5">
      <AppHeader />
      <main className="mx-auto grid min-h-[calc(100svh-104px)] max-w-[1080px] grid-cols-2 items-center gap-20 py-16 touch:max-w-[520px] touch:grid-cols-1 touch:gap-8 mobile:py-9">
        <section>
          <div className="mb-8 flex items-center gap-3 text-sage mobile:mb-5" aria-hidden="true">
            <span className="grid size-14 place-items-center rounded-full border border-sage-detail-border bg-sage-light"><DumbbellIcon size={30} /></span>
            <span className="grid size-14 place-items-center rounded-full border border-sage-detail-border bg-sage-light"><ActivityIcon activity="zone2" size={38} /></span>
            <span className="grid size-14 place-items-center rounded-full border border-lavender-detail-border bg-lavender-light text-lavender"><ActivityIcon activity="rest" size={38} /></span>
          </div>
          <h1 className="max-w-[12ch] font-heading text-[64px] leading-[1.05] font-semibold tracking-[-.8px] mobile:text-[48px]">Tu rutina, un día a la vez.</h1>
          <p className="mt-5 max-w-[38ch] text-[14px] leading-[1.8] text-muted mobile:mt-3 mobile:text-[13px]">Un espacio para tu semana de fuerza, cardio y descanso.</p>
        </section>

        <Card className="w-full">
          <CardHeader>
            <h2 className="font-heading text-[34px] leading-[1.15] font-semibold">Bienvenido a mi rutina</h2>
            <CardDescription>Entra con tu cuenta de Google para consultar tu entrenamiento.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {error && <p role="alert" className="rounded-lg border border-coral-detail-border bg-coral-light p-3 text-[12px] leading-[1.7] text-coral">No se pudo completar el acceso con Google. Vuelve a intentarlo.</p>}
            {!available && <p role="status" className="rounded-lg border border-line bg-paper p-3 text-[12px] leading-[1.7] text-muted">El acceso con Google no está disponible en este momento.</p>}
            <GoogleSignInButton available={available} />
          </CardContent>
          <CardFooter>
            <p className="max-w-[45ch] text-[11px] leading-[1.7] text-muted">Si es tu primera vez, crearemos tu cuenta al continuar con Google.</p>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
