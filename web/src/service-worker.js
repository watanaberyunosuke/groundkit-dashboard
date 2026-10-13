// Service worker for the home-screen app. vite.config.ts emits it as /sw.js at build
// time, prefixed with BUILD (a hash of the build's file names) and ASSETS (every hashed
// file under /assets/). main.tsx registers it in production builds only.
//
//   Page (navigations)   network first; after 4 s, or offline, the last page cached.
//   /assets/*            cache first. Names are content-hashed, so they never go stale.
//                        Kept across deploys and pruned to the current build, so the
//                        DuckDB WASM file is only downloaded again when it changes.
//   /api/tables/*        network first; after 8 s, or offline, the last copy cached.
//   Other /api/*         network only: live positions, weather, tracks and schedules
//                        must not be shown from a cache.
//   Fonts, DuckDB's ICU extension, icons and the manifest
//                        stale-while-revalidate.
/* global BUILD, ASSETS */

const SHELL = `gk-shell-${BUILD}`;
const ASSET_CACHE = "gk-assets";
const DATA = "gk-data";
const STATIC = "gk-static";
const KEEP = new Set([SHELL, ASSET_CACHE, DATA, STATIC]);
const CACHED_ORIGINS = new Set([
  "https://fonts.googleapis.com",
  "https://fonts.gstatic.com",
  "https://extensions.duckdb.org",
]);

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const shell = await caches.open(SHELL);
    await shell.addAll(["/", "/manifest.webmanifest", "/icon.svg"]);
    // The DuckDB WASM file is large: it is cached the first time the page asks for it.
    const assets = await caches.open(ASSET_CACHE);
    const missing = [];
    for (const url of ASSETS) {
      if (!url.endsWith(".wasm") && !(await assets.match(url))) missing.push(url);
    }
    await assets.addAll(missing);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (name.startsWith("gk-") && !KEEP.has(name)) await caches.delete(name);
    }
    const current = new Set(ASSETS.map((u) => new URL(u, self.location.origin).href));
    const assets = await caches.open(ASSET_CACHE);
    for (const req of await assets.keys()) {
      if (!current.has(req.url)) await assets.delete(req);
    }
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    if (req.mode === "navigate") {
      event.respondWith(networkFirst(req, SHELL, 4000, "/"));
    } else if (url.pathname.startsWith("/assets/")) {
      event.respondWith(cacheFirst(req, ASSET_CACHE));
    } else if (url.pathname.startsWith("/api/tables/")) {
      event.respondWith(networkFirst(req, DATA, 8000));
    } else if (!url.pathname.startsWith("/api/")) {
      event.respondWith(staleWhileRevalidate(req, STATIC));
    }
  } else if (CACHED_ORIGINS.has(url.origin)) {
    event.respondWith(staleWhileRevalidate(req, STATIC));
  }
});

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) await cache.put(req, res.clone());
  return res;
}

// Network first. If the network has not answered after `waitMs` and a cached copy exists,
// answer from the cache and let the network response refresh it in the background.
// Without a cached copy, wait for the network however long it takes.
async function networkFirst(req, cacheName, waitMs, cacheKey = req) {
  const cache = await caches.open(cacheName);
  const network = fetch(req).then(async (res) => {
    if (res.ok) await cache.put(cacheKey, res.clone());
    return res;
  });
  network.catch(() => {}); // a late failure after the cache has answered
  const cached = cache.match(cacheKey);
  const timeout = new Promise((resolve) => setTimeout(resolve, waitMs));
  try {
    const first = await Promise.race([network, timeout.then(() => cached)]);
    if (first) return first;
    return await network;
  } catch (err) {
    const hit = await cached;
    if (hit) return hit;
    throw err;
  }
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  const network = fetch(req).then(async (res) => {
    if (res.ok || res.type === "opaque") await cache.put(req, res.clone());
    return res;
  });
  if (hit) {
    network.catch(() => {});
    return hit;
  }
  return network;
}
