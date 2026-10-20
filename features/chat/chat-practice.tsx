"use client";

import { useEffect, useRef, useState } from "react";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const scenarios = [
  { id: "自由对话", label: "自由对话" },
  { id: "日常寒暄", label: "日常寒暄" },
  { id: "餐厅点餐", label: "餐厅点餐" },
  { id: "面试/自我介绍", label: "面试/自我介绍" },
  { id: "购物", label: "购物" },
];

function MessageBubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user";
  const [main, feedback] = msg.content.split(/反馈：/);

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
          isUser
            ? "bg-slate-900 text-white"
            : "bg-slate-100 text-slate-800"
        }`}
      >
        <p className="whitespace-pre-wrap">{main}</p>
        {feedback && (
          <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1.5 text-xs text-amber-800">
            反馈：{feedback}
          </p>
        )}
      </div>
    </div>
  );
}

export function ChatPractice() {
  const [lang, setLang] = useState<"en" | "ja">("en");
  const [scenario, setScenario] = useState(scenarios[0].id);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const content = input.trim();
    if (!content || sending) return;

    const nextHistory: Msg[] = [...messages, { role: "user", content }];
    setMessages(nextHistory);
    setInput("");
    setSending(true);
    setError("");

    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lang, scenario, messages: nextHistory }),
    });
    const data = await res.json();

    if (res.ok) {
      setMessages([...nextHistory, { role: "assistant", content: data.reply }]);
    } else {
      setError(data.error ?? "发送失败");
    }
    setSending(false);
  }

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col">
      {/* 控制栏 */}
      <div className="flex flex-wrap items-center gap-2 pb-3">
        <div className="flex rounded-lg border border-slate-200 p-0.5">
          {(["en", "ja"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`rounded-md px-3 py-1 text-sm ${
                lang === l ? "bg-slate-900 text-white" : "text-slate-600"
              }`}
            >
              {l === "en" ? "英语" : "日语"}
            </button>
          ))}
        </div>
        <select
          value={scenario}
          onChange={(e) => setScenario(e.target.value)}
          className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-700"
        >
          {scenarios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => setMessages([])}
          className="text-sm text-slate-400 hover:text-slate-700"
        >
          清空对话
        </button>
      </div>

      {/* 消息区 */}
      <div className="flex-1 space-y-3 overflow-y-auto rounded-xl border border-slate-200 p-4">
        {messages.length === 0 && (
          <p className="py-16 text-center text-sm text-slate-400">
            用{lang === "en" ? "英语" : "日语"}说点什么开始对话吧
          </p>
        )}
        {messages.map((m, i) => (
          <MessageBubble key={i} msg={m} />
        ))}
        {sending && (
          <p className="text-sm text-slate-400">对方正在输入…</p>
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="pt-2 text-sm text-rose-600">{error}</p>}

      {/* 输入区 */}
      <div className="flex gap-2 pt-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder={lang === "en" ? "Type in English..." : "日本語で入力…"}
        />
        <button
          onClick={send}
          disabled={sending}
          className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          发送
        </button>
      </div>
    </div>
  );
}
