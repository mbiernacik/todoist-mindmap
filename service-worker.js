const CACHE_NAME = "td-mindmap-v1";
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/service-worker.js",
  "https://cdn.jsdelivr.net/npm/markmap-autoloader@latest"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(APP_SHELL)));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // Network-first dla API Todoist; cache-first dla shellu
  const isShell = APP_SHELL.some(p => url.href.includes(p)) || url.origin === location.origin;
  if (isShell) {
    e.respondWith(
      caches.match(e.request).then((res) =>
        res || fetch(e.request).then((r) => {
          const copy = r.clone();
          caches.open(CACHE_NAME).then((c) => c.put(e.request, copy));
          return r;
        }).catch(() => caches.match("/index.html"))
      )
    );
  } else {
    e.respondWith(fetch(e.request).catch(() => new Response("Offline", { status: 503 })));
  }
});
