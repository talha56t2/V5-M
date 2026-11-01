/* V3 Attendance - service worker
   Bump CACHE_VERSION whenever you change any app file so phones pick up the update. */
const CACHE_VERSION = "v2";
const CACHE = "v3-attendance-" + CACHE_VERSION;

const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // Page loads: serve cached shell instantly, refresh it in the background
  if (req.mode === "navigate") {
    event.respondWith(
      caches.match("./index.html").then(cached => {
        const refresh = fetch(req).then(res => {
          if (res && res.ok) caches.open(CACHE).then(c => c.put("./index.html", res.clone()));
          return res;
        }).catch(() => null);
        return cached || refresh || caches.match("./");
      })
    );
    return;
  }

  // Everything else: cache first, fall back to network (and remember it)
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      if (res && res.ok) caches.open(CACHE).then(c => c.put(req, res.clone()));
      return res;
    }))
  );
});
