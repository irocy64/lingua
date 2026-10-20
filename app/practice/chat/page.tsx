import { ChatPractice } from "@/features/chat/chat-practice";

export const metadata = {
  title: "AI 口语对话",
};

export default function ChatPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="pb-3 text-xl font-bold">AI 口语对话</h1>
      <ChatPractice />
    </main>
  );
}
