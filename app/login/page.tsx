import Link from "next/link";
import { AuthForm } from "@/features/auth/auth-form";

export const metadata = { title: "登录" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex max-w-sm flex-col px-4 py-16">
      <h1 className="text-2xl font-bold">登录</h1>
      <div className="mt-6">
        <AuthForm mode="login" />
      </div>
      <p className="mt-4 text-center text-sm text-slate-500">
        还没有账号？
        <Link href="/register" className="ml-1 text-slate-900 hover:underline">
          注册
        </Link>
      </p>
    </main>
  );
}
