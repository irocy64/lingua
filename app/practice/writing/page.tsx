import { WritingPractice } from "@/features/writing/writing-practice";

export const metadata = {
  title: "AI 写作批改",
};

export default function WritingPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="pb-4 text-xl font-bold">AI 写作批改</h1>
      <WritingPractice />
    </main>
  );
}
