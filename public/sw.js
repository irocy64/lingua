/**
 * Lingua Service Worker（基础离线能力）
 * - 页面导航：只走网络，不缓存（避免缓存到流式渲染的半截页面/登录页）
 * - 静态资源（/_next/static、图标）：缓存优先
 * - 不缓存 API（含鉴权与 AI 请求）
 */
const CACHE = "lingua-v3";
const OFFLINE_SHELL = ["/"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(OFFLINE_SHELL))
      .catch(() => {})
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
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // 静态资源：缓存优先
  if (
    url.pathname.startsWith("/_next/static") ||
    /\.(png|svg|ico|jpg|jpeg|woff2?)$/.test(url.pathname)
  ) {
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

  // 页面导航：只走网络；离线时回退到缓存的首页
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match("/").then((cached) => cached || Response.error())
      )
    );
  }
});
