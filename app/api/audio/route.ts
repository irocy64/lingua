import { getActiveApiUser } from "@/lib/access";
import {
  isAllowedAudioHost,
  isPrivateHostname,
} from "@/lib/audio";

const MAX_BYTES = 120 * 1024 * 1024;

/**
 * 音频同源代理：解决 BBC/NPR 等音频的 http 混合内容与国内直连问题。
 * 只允许白名单域名，转发 Range 以支持拖动进度。
 */
export async function GET(request: Request) {
  const user = await getActiveApiUser();
  if (!user) {
    return new Response("unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("url");
  if (!raw) return new Response("missing url", { status: 400 });

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new Response("invalid url", { status: 400 });
  }
  if (target.protocol === "http:") target.protocol = "https:";
  if (target.protocol !== "https:") {
    return new Response("invalid protocol", { status: 400 });
  }
  if (!isAllowedAudioHost(target.hostname) || isPrivateHostname(target.hostname)) {
    return new Response("host not allowed", { status: 403 });
  }

  const headers: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (compatible; LinguaAudio/1.0; +https://lingua-irocy64.netlify.app)",
    Accept: "audio/*,*/*;q=0.8",
  };
  const range = request.headers.get("range");
  if (range) headers.Range = range;

  let upstream: Response;
  try {
    upstream = await fetch(target.toString(), {
      headers,
      redirect: "follow",
      signal: AbortSignal.timeout(30000),
    });
  } catch {
    return new Response("audio source unavailable", { status: 502 });
  }

  if (!upstream.ok && upstream.status !== 206) {
    return new Response(`audio source error ${upstream.status}`, {
      status: 502,
    });
  }

  // 跟随重定向后再次检查最终地址，避免被白名单域名重定向到内网
  if (upstream.url) {
    try {
      const finalUrl = new URL(upstream.url);
      if (isPrivateHostname(finalUrl.hostname)) {
        return new Response("redirect not allowed", { status: 403 });
      }
    } catch {
      return new Response("invalid redirect", { status: 502 });
    }
  }

  const length = Number(upstream.headers.get("content-length") ?? "0");
  if (length > MAX_BYTES) {
    return new Response("audio too large", { status: 413 });
  }

  const outHeaders = new Headers();
  for (const name of [
    "content-type",
    "content-length",
    "content-range",
    "accept-ranges",
    "last-modified",
    "etag",
  ]) {
    const value = upstream.headers.get(name);
    if (value) outHeaders.set(name, value);
  }
  outHeaders.set("Cache-Control", "public, max-age=3600");
  if (!outHeaders.has("accept-ranges")) outHeaders.set("accept-ranges", "bytes");

  return new Response(upstream.body, {
    status: upstream.status,
    headers: outHeaders,
  });
}
