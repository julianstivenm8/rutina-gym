import Link from "next/link";
import type { AuthenticatedUser } from "@/lib/auth-types";
import { ActivityIcon, DumbbellIcon } from "./icons";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import { AppNavigation } from "./app-navigation";

export function AppHeader({ user }: { user?: AuthenticatedUser }) {
  return (
    <header className="flex min-h-[103px] items-center justify-between gap-4 border-b border-line mobile:min-h-20 mobile:gap-3">
      <div className="flex min-w-0 items-center gap-2 mobile:gap-0">
        {user && <AppNavigation user={user} />}
        <Link
          className="inline-flex items-center gap-2.5 text-[23px] font-[650] tracking-[-1.1px] no-underline mobile:text-[21px]"
          href="/"
          aria-label="Mi rutina, inicio"
        >
          <span className="grid size-[39px] place-items-center rounded-xl bg-sage-dark text-paper mobile:size-[34px] mobile:rounded-[10px] mobile:[&>svg]:size-[23px]">
            <DumbbellIcon size={26} />
          </span>
          <span>
            mi rutina<span className="text-sage">.</span>
          </span>
        </Link>
      </div>
      <div className="flex items-center gap-5 mobile:gap-3">
        {!user && (
          <div className="flex items-center gap-[9px] text-[12px] text-sage mobile:gap-[5px] mobile:text-[10px] mobile:[&>svg]:size-5 max-[420px]:[&>span]:hidden">
            <ActivityIcon activity="rest" size={23} />
            <span>Constancia, a tu ritmo.</span>
          </div>
        )}
        <ThemeToggle />
        {user && <UserMenu user={user} />}
      </div>
    </header>
  );
}
