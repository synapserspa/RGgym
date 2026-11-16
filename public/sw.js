// Service Worker: funcionamiento offline (precache + stale-while-revalidate)
const CACHE = 'metodo-rod-v10'

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE)
    const base = self.registration.scope
    const core = [base, base + 'index.html', base + 'manifest.json', base + 'icons/icon-192.png', base + 'icons/icon-512.png', base + 'manual-usuario.pdf']
    await cache.addAll(core).catch(() => {})
    // Precarga los assets generados por el build (js/css) leyendo el index.html
    try {
      const html = await (await fetch(base + 'index.html', { cache: 'no-cache' })).text()
      const urls = [...html.matchAll(/(?:src|href)="(\.\/assets\/[^"]+)"/g)].map((m) => new URL(m[1], base).href)
      await cache.addAll(urls)
    } catch (e) { /* sin red durante la instalación: se cacheará en uso */ }
    self.skipWaiting()
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return
  if (new URL(req.url).pathname.endsWith('/estado.json')) return // el interruptor del propietario siempre va a la red
  event.respondWith((async () => {
    const cache = await caches.open(CACHE)
    // Páginas: red primero (siempre la versión nueva); sin conexión, la copia guardada
    if (req.mode === 'navigate') {
      try {
        const res = await fetch(req)
        if (res && res.ok) { cache.put(self.registration.scope + 'index.html', res.clone()); return res }
      } catch (e) { /* offline */ }
      return (await cache.match(self.registration.scope + 'index.html')) || (await cache.match(self.registration.scope)) || new Response('Sin conexión', { status: 503 })
    }
    const cached = await cache.match(req, { ignoreSearch: true })
    const network = fetch(req).then((res) => {
      if (res && res.ok) cache.put(req, res.clone())
      return res
    }).catch(() => null)
    if (cached) { network.catch(() => {}); return cached }
    const res = await network
    if (res) return res
    if (req.mode === 'navigate') return (await cache.match(self.registration.scope + 'index.html')) || (await cache.match(self.registration.scope))
    return new Response('', { status: 504 })
  })())
})
