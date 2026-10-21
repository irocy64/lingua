import Link from "next/link";
import { UserMenu } from "@/features/auth/user-menu";
import { NavLinks } from "@/features/nav/nav-links";

export function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 font-semibold">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#4d6bfe] text-sm font-bold text-white">
            L
          </span>
          <span className="text-lg font-semibold tracking-tight text-slate-900">
            Lingua
          </span>
          <span className="hidden text-xs font-normal text-slate-500 sm:inline">
            英语 · 日语学习平台
          </span>
        </Link>
        <nav className="flex min-w-0 max-w-full flex-1 items-center justify-end gap-1 overflow-x-auto whitespace-nowrap text-xs sm:text-sm">
          <NavLinks />
          <UserMenu />
        </nav>
      </div>
    </header>
  );
}
