import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth-session";
import { AppHeader } from "@/components/app-header";

export const dynamic = "force-dynamic";
export default async function RoutinesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();
  if (!session) redirect("/iniciar-sesion");
  return (
    <div className="mx-auto max-w-[1440px] px-16 compact:px-9 tablet:px-[26px] mobile:px-5 small:px-3.5">
      <AppHeader
        user={{ name: session.user.name, email: session.user.email }}
      />
      <main id="main-content" className="pb-16">
        {children}
      </main>
    </div>
  );
}
