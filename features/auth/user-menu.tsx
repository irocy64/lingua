"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export function UserMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <span className="ml-1 h-7 w-16 rounded-md bg-slate-100" />;
  }

  if (session?.user) {
    return (
      <Link
        href="/settings"
        className="ml-1 rounded-md bg-slate-100 px-2 py-1 text-slate-700 hover:bg-slate-200"
      >
        {session.user.name ?? "账户"}
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className="ml-1 rounded-md bg-slate-900 px-2 py-1 text-white hover:bg-slate-700"
    >
      登录
    </Link>
  );
}
