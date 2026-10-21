"use client";

import { useRef, useState } from "react";

const RATES = [0.75, 1, 1.25, 1.5];

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function AudioPlayer({ src, title }: { src: string; title: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [rate, setRate] = useState(1);
  const [error, setError] = useState("");

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio
        .play()
        .catch(() => setError("音频加载失败，可点击原文链接收听"));
    } else {
      audio.pause();
    }
  }

  function skip(delta: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(
      0,
      Math.min(audio.duration || current + delta, audio.currentTime + delta)
    );
  }

  function cycleRate() {
    const audio = audioRef.current;
    const next = RATES[(RATES.indexOf(rate) + 1) % RATES.length];
    setRate(next);
    if (audio) audio.playbackRate = next;
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <audio
        ref={audioRef}
        src={src}
        preload="none"
        onLoadedMetadata={(event) => {
          const value = event.currentTarget.duration;
          setDuration(Number.isFinite(value) ? value : 0);
        }}
        onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onError={() => setError("音频加载失败，可点击原文链接收听")}
        className="hidden"
      />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? `暂停 ${title}` : `播放 ${title}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm text-white hover:bg-slate-700"
        >
          {playing ? "❚❚" : "▶"}
        </button>
        <button
          type="button"
          onClick={() => skip(-10)}
          className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
        >
          -10s
        </button>
        <button
          type="button"
          onClick={() => skip(10)}
          className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
        >
          +10s
        </button>
        <button
          type="button"
          onClick={cycleRate}
          className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
        >
          {rate}x
        </button>
        <span className="ml-auto shrink-0 text-xs tabular-nums text-slate-500">
          {formatTime(current)} / {duration > 0 ? formatTime(duration) : "--:--"}
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={duration || 0}
        step={1}
        value={Math.min(current, duration || 0)}
        onChange={(event) => {
          const audio = audioRef.current;
          if (!audio) return;
          const value = Number(event.target.value);
          audio.currentTime = value;
          setCurrent(value);
        }}
        aria-label="播放进度"
        className="mt-2 w-full accent-slate-900"
      />

      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
