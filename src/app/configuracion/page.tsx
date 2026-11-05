import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth-session";
import { getAccountSettings } from "@/lib/account-settings-server";
import { AppHeader } from "@/components/app-header";
import { SettingsPage } from "@/components/settings/settings-page";

export const dynamic = "force-dynamic";
export const metadata = { title: "Configuración · Mi rutina" };
export default async function ConfigurationPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const auth = await getCurrentSession();
  if (!auth) redirect("/iniciar-sesion");
  const settings = await getAccountSettings(auth);
  const googleError = (await searchParams).error === "google";
  return (
    <div className="mx-auto max-w-[1440px] px-16 compact:px-9 tablet:px-[26px] mobile:px-5 small:px-3.5">
      <AppHeader user={{ name: auth.user.name, email: auth.user.email }} />
      <main id="main-content" className="pb-16">
        <SettingsPage initial={settings} googleError={googleError} />
      </main>
    </div>
  );
}
