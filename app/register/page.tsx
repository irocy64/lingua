import Link from "next/link";
import { AuthForm } from "@/features/auth/auth-form";

export const metadata = { title: "注册" };

export default function RegisterPage() {
  return (
    <main className="mx-auto flex max-w-sm flex-col px-4 py-16">
      <h1 className="text-2xl font-bold">注册</h1>
      <div className="mt-6">
        <AuthForm mode="register" />
      </div>
      <p className="mt-4 text-center text-sm text-slate-500">
        已有账号？
        <Link href="/login" className="ml-1 text-slate-900 hover:underline">
          去登录
        </Link>
      </p>
    </main>
  );
}
