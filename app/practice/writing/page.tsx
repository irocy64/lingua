import { WritingPractice } from "@/features/writing/writing-practice";
import { requireUser } from "@/lib/access";

export const metadata = {
  title: "AI 写作批改",
};

export const instant = false;

export default async function WritingPage() {
  await requireUser();

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="pb-4 text-xl font-bold">AI 写作批改</h1>
      <WritingPractice />
    </main>
  );
}
