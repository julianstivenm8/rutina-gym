import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth-session";
import { getBodyOverview } from "@/lib/body-repository";
import { AppHeader } from "@/components/app-header";
import { BodyDashboard } from "@/components/body/body-dashboard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mi cuerpo · Mi rutina" };
export default async function BodyPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/iniciar-sesion");
  const overview = await getBodyOverview(session.user.id);
  return (
    <div className="mx-auto max-w-[1440px] px-16 compact:px-9 tablet:px-[26px] mobile:px-5 small:px-3.5">
      <AppHeader
        user={{ name: session.user.name, email: session.user.email }}
      />
      <main id="main-content" className="pb-16">
        <BodyDashboard initial={overview} />
      </main>
    </div>
  );
}
