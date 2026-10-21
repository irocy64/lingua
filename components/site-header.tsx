import Link from "next/link";
import { UserMenu } from "@/features/auth/user-menu";
import { NavLinks } from "@/features/nav/nav-links";

export function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold">
          <span className="sci-dot" />
          <span className="sci-logo">LINGUA</span>
          <span className="sci-tag hidden sm:inline">NEURAL LANGUAGE OS</span>
        </Link>
        <nav className="flex min-w-0 max-w-full flex-1 items-center justify-end gap-1 overflow-x-auto whitespace-nowrap text-xs sm:text-sm">
          <NavLinks />
          <UserMenu />
        </nav>
      </div>
    </header>
  );
}
