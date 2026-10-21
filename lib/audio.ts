const AUDIO_HOSTS = [
  /(^|\.)bbc\.co\.uk$/i,
  /(^|\.)bbci\.co\.uk$/i,
  /(^|\.)simplecastaudio\.com$/i,
  /(^|\.)podtrac\.com$/i,
  /(^|\.)megaphone\.fm$/i,
  /(^|\.)akamaihd\.net$/i,
  /(^|\.)llnwd\.net$/i,
];

export function isAllowedAudioHost(hostname: string): boolean {
  return AUDIO_HOSTS.some((pattern) => pattern.test(hostname));
}

export function isPrivateHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    host === "localhost" ||
    host === "::1" ||
    host.endsWith(".local") ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  );
}

/** 把外部音频换成同源代理地址，避免 http 混合内容与国内直连问题 */
export function proxyAudioUrl(raw: string): string {
  if (!raw || raw.startsWith("/")) return raw;
  try {
    const url = new URL(raw);
    if (url.protocol === "http:") url.protocol = "https:";
    return `/api/audio?url=${encodeURIComponent(url.toString())}`;
  } catch {
    return raw;
  }
}
