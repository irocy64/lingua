import { Suspense } from "react";
import { redirect } from "next/navigation";
import { StudySession } from "@/features/study/study-session";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { decks } from "@/db/schema";

export const metadata = {
  title: "学习",
};

export const instant = false;

export default async function StudyPage({
  searchParams,
}: {
  searchParams: Promise<{ deck?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { deck } = await searchParams;
  const deckOptions = await db
    .select({ id: decks.id, name: decks.name, language: decks.language })
    .from(decks);

  return (
    <Suspense fallback={<p className="py-20 text-center text-slate-500">加载中…</p>}>
      <StudySession deck={deck} decks={deckOptions} />
    </Suspense>
  );
}
