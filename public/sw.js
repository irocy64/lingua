/**
 * Lingua Service Worker（基础离线能力）
 * - 导航请求：网络优先，离线回退缓存（app shell）
 * - 静态资源（/_next/static、图标）：缓存优先
 * - 不缓存 API（含鉴权与 AI 请求）
 */
const CACHE = "lingua-v1";
const APP_SHELL = ["/dashboard", "/decks"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/")) return;

  // 静态资源：缓存优先
  if (url.pathname.startsWith("/_next/static") || /\.(png|svg|ico|jpg|jpeg)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
            return res;
          })
      )
    );
    return;
  }

  // 导航：网络优先，失败回退缓存
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((c) => c || caches.match("/dashboard")))
    );
  }
});
