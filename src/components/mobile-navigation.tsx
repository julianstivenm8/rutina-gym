"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Layers3, PersonStanding, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const destinations = [
  { href: "/", label: "Mi semana", icon: CalendarDays },
  { href: "/rutinas", label: "Mis rutinas", icon: Layers3 },
  { href: "/mi-cuerpo", label: "Mi cuerpo", icon: PersonStanding },
  { href: "/configuracion", label: "Perfil", icon: UserRound },
] as const;

export function MobileNavigation() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navegación móvil"
      data-slot="mobile-navigation"
      className="fixed inset-x-0 bottom-0 z-40 hidden border-t border-line bg-surface/95 pl-[max(8px,env(safe-area-inset-left))] pr-[max(8px,env(safe-area-inset-right))] pt-1.5 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl mobile:block"
    >
      <ul className="mx-auto m-0 grid max-w-[560px] list-none grid-cols-4 gap-1 p-0">
        {destinations.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/" && pathname.startsWith(href + "/"));
          return (
            <li key={href} className="min-w-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[60px] min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[10px] leading-tight no-underline focus-visible:outline-offset-[-3px]",
                  active
                    ? "font-semibold text-coral"
                    : "font-medium text-muted hover:text-ink",
                )}
              >
                <span
                  className={cn(
                    "grid h-7 w-12 place-items-center rounded-xl",
                    active && "bg-coral-light",
                  )}
                >
                  <Icon
                    size={22}
                    strokeWidth={active ? 2 : 1.7}
                    aria-hidden="true"
                  />
                </span>
                <span className="whitespace-nowrap">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
