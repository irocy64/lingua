"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

export function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {navItems.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(`${item.href}/`));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`sci-nav shrink-0 rounded-md px-2 py-1 ${
              active ? "sci-nav-active" : ""
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
