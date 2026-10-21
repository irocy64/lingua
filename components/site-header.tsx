import Link from "next/link";
import { UserMenu } from "@/features/auth/user-menu";

const navItems = [
  { href: "/dashboard", label: "仪表盘" },
  { href: "/decks", label: "词书" },
  { href: "/search", label: "搜词" },
  { href: "/reader", label: "精读" },
  { href: "/reading", label: "外刊" },
  { href: "/listening", label: "听力" },
  { href: "/kana", label: "假名" },
  { href: "/practice/chat", label: "AI 练习" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="text-lg">Lingua</span>
          <span className="hidden text-xs font-normal text-slate-500 sm:inline">
            英语 · 日语学习平台
          </span>
        </Link>
        <nav className="flex max-w-full items-center gap-1 overflow-x-auto whitespace-nowrap text-xs sm:text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              {item.label}
            </Link>
          ))}
          <UserMenu />
        </nav>
      </div>
    </header>
  );
}
