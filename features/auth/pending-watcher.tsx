"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function PendingWatcher() {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => router.refresh(), 15000);
    return () => clearInterval(timer);
  }, [router]);

  return (
    <p className="mt-6 text-xs text-slate-400">
      页面每 15 秒自动刷新，管理员通过后会自动进入仪表盘。
    </p>
  );
}
