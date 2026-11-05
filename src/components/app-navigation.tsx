"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Layers3,
  Menu,
  Plus,
  PersonStanding,
  Settings,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
  SheetFooter,
} from "./ui/sheet";
import { cn } from "@/lib/utils";
import type { AuthenticatedUser } from "@/lib/auth-types";

export function AppNavigation({ user }: { user: AuthenticatedUser }) {
  const pathname = usePathname();
  const pages = [
    {
      href: "/",
      title: "Mi semana",
      description: "Tu entrenamiento de hoy",
      icon: CalendarDays,
    },
    {
      href: "/rutinas",
      title: "Mis rutinas",
      description: "Tus ciclos, a tu ritmo",
      icon: Layers3,
    },
    {
      href: "/mi-cuerpo",
      title: "Mi cuerpo",
      description: "Tus medidas y tu recorrido",
      icon: PersonStanding,
    },
    {
      href: "/rutinas/nueva",
      title: "Crear rutina",
      description: "Dale forma a tu próxima semana",
      icon: Plus,
    },
  ];
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Abrir menú de navegación"
        >
          <Menu size={23} />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[340px] max-w-[90vw] border-line p-0 text-ink"
      >
        <SheetHeader className="px-7 pt-12 pb-8">
          <SheetTitle className="font-heading text-[36px]">
            Tu espacio.
          </SheetTitle>
          <SheetDescription>
            Un poco de fuerza. Un poco de cardio.
          </SheetDescription>
        </SheetHeader>
        <nav
          aria-label="Navegación principal"
          className="flex flex-col gap-2 px-4"
        >
          {pages.map(({ href, title, description, icon: Icon }) => (
            <SheetClose asChild key={href}>
              <Link
                href={href}
                aria-current={pathname === href ? "page" : undefined}
                className={cn(
                  "flex items-center gap-4 rounded-xl px-4 py-4 no-underline hover:bg-sage-light",
                  pathname === href && "bg-sage-light",
                )}
              >
                <Icon size={23} className="shrink-0 text-sage" />
                <span>
                  <strong className="block text-sm font-medium">{title}</strong>
                  <span className="mt-1 block text-xs text-muted">
                    {description}
                  </span>
                </span>
              </Link>
            </SheetClose>
          ))}
        </nav>
        <SheetFooter className="border-t border-line p-4">
          <SheetClose asChild>
            <Link
              href="/configuracion"
              aria-current={pathname === "/configuracion" ? "page" : undefined}
              className={cn(
                "flex min-w-0 items-center gap-3 rounded-xl p-3 no-underline hover:bg-sage-light",
                pathname === "/configuracion" && "bg-sage-light",
              )}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-surface text-sage">
                <Settings size={19} />
              </span>
              <span className="min-w-0">
                <strong className="block text-sm font-medium">
                  Configuración
                </strong>
                <span className="mt-1 block truncate text-[11px] text-muted">
                  {user.name || "Mi cuenta"}
                </span>
                <span className="mt-0.5 block truncate text-[10px] text-muted">
                  {user.email}
                </span>
              </span>
            </Link>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
