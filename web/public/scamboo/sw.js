/* Call protection prototype: offline app shell (cache-first) */
const CACHE = "cp-v5";
const SHELL = [
  "./", "index.html", "call.html", "history.html", "help.html", "guardian.html", "onboarding.html", "family.html",
  "settings.html", "officer.html",
  "manifest.json", "assets/css/styles.css", "assets/js/store.js", "assets/js/ui.js", "assets/js/demo.js", "assets/js/live.js", "assets/js/lab-config.js", "connector.html",
  "assets/icons/icon-192.png", "assets/icons/icon-512.png", "assets/icons/maskable-512.png", "assets/icons/apple-touch-icon.png", "assets/icons/favicon-32.png",
  "assets/brand/logo.png", "assets/brand/ghost.png", "assets/brand/ghost-96.png",
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  const isFont = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (url.origin !== location.origin && !isFont) return;
  if (url.pathname.includes("/api/")) return;  // live lab answers are never cached
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(res => {
    if (res.ok || res.type === "opaque") {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
    }
    return res;
  }).catch(() => caches.match("index.html"))));
});
