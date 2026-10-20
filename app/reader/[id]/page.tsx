import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { getText } from "@/server/reader";
import { ReaderView } from "@/features/reader/reader-view";
import { auth } from "@/lib/auth";

export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const text = session?.user ? await getText(session.user.id, id) : undefined;
  return { title: text?.title ?? "阅读" };
}

export default async function ReaderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { id } = await params;
  const text = await getText(session.user.id, id);
  if (!text) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/reader" className="text-sm text-slate-500 hover:text-slate-800">
        ← 返回阅读列表
      </Link>
      <div className="mt-3">
        <ReaderView
          title={text.title}
          content={text.content}
          lang={text.lang}
          sourceUrl={text.sourceUrl}
        />
      </div>
    </main>
  );
}
